import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import App from '../App';
import GameList from '../components/GameList';
import TeamSelector from '../components/TeamSelector';
import { getTeamSchedule, getAllGames } from '../services/nhlApi';

jest.mock('../services/nhlApi', () => ({
  getTeamSchedule: jest.fn(),
  getAllGames: jest.fn(),
}));

jest.mock('../components/GameList', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../components/TeamSelector', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe('App', () => {
  const getTeamScheduleMock = getTeamSchedule as jest.MockedFunction<typeof getTeamSchedule>;
  const getAllGamesMock = getAllGames as jest.MockedFunction<typeof getAllGames>;
  const gameListMock = GameList as unknown as jest.Mock;
  const teamSelectorMock = TeamSelector as unknown as jest.Mock;

  beforeEach(() => {
    getTeamScheduleMock.mockReset();
    getAllGamesMock.mockReset();
    gameListMock.mockClear();
    teamSelectorMock.mockClear();
  });

  function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it('fetches the Kraken schedule by default', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);
    expect(getTeamScheduleMock).toHaveBeenCalledWith('SEA');
  });

  it('passes loading state to GameList on initial render', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);
    const initialProps = gameListMock.mock.calls[0][0];
    expect(initialProps).toMatchObject({ games: [], loading: true, error: null, tab: 'upcoming' });
  });

  it('passes loaded games to GameList after fetch resolves', async () => {
    const games = [
      {
        id: '1',
        opponent: 'Canucks',
        opponentAbbrev: 'VAN',
        date: 'Fri, Jan 10',
        gameTime: '7:00 PM',
        homeAway: 'home' as const,
        venue: 'Climate Pledge Arena',
        status: 'upcoming' as const,
        teamAbbrev: 'SEA',
        teamScore: null,
        opponentScore: null,
      },
    ];
    getTeamScheduleMock.mockResolvedValue(games);
    render(<App />);

    await waitFor(() => {
      const latestProps = gameListMock.mock.calls.at(-1)?.[0];
      expect(latestProps).toMatchObject({ games, loading: false, error: null });
    });
  });

  it('passes error state to GameList when fetch fails', async () => {
    getTeamScheduleMock.mockRejectedValue(new Error('network error'));
    render(<App />);

    await waitFor(() => {
      const latestProps = gameListMock.mock.calls.at(-1)?.[0];
      expect(latestProps).toMatchObject({ games: [], loading: false, error: 'Could not load schedule' });
    });
  });

  it('passes onTabChange to GameList', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);
    const props = gameListMock.mock.calls[0][0];
    expect(typeof props.onTabChange).toBe('function');
  });

  it('renders the selected team name in the header', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);
    expect(screen.getByText(/Seattle Kraken/)).toBeTruthy();
  });

  it('renders TeamSelector with correct initial props', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);
    const selectorProps = teamSelectorMock.mock.calls[0][0];
    expect(selectorProps).toMatchObject({ visible: false, selectedTeam: 'SEA' });
    expect(typeof selectorProps.onSelect).toBe('function');
    expect(typeof selectorProps.onClose).toBe('function');
  });

  it('opens team selector when header is pressed', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);

    fireEvent.press(screen.getByText(/Seattle Kraken/));

    const latestProps = teamSelectorMock.mock.calls.at(-1)?.[0];
    expect(latestProps.visible).toBe(true);
  });

  it('closes team selector when onClose is called', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);

    fireEvent.press(screen.getByText(/Seattle Kraken/));
    const openProps = teamSelectorMock.mock.calls.at(-1)?.[0];
    act(() => { openProps.onClose(); });

    const closedProps = teamSelectorMock.mock.calls.at(-1)?.[0];
    expect(closedProps.visible).toBe(false);
  });

  it('falls back to the team code in the header when team name is not found', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(1));

    const selectorProps = teamSelectorMock.mock.calls[0][0];
    selectorProps.onSelect('XYZ');

    await waitFor(() => {
      expect(screen.getByText(/XYZ/)).toBeTruthy();
    });
  });

  it('calls getAllGames and passes groupByDate=true when All Teams is selected', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    getAllGamesMock.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(1));

    const selectorProps = teamSelectorMock.mock.calls[0][0];
    act(() => { selectorProps.onSelect(null); });

    await waitFor(() => expect(getAllGamesMock).toHaveBeenCalledTimes(1));
    expect(getTeamScheduleMock).toHaveBeenCalledTimes(1);

    const latestProps = gameListMock.mock.calls.at(-1)?.[0];
    expect(latestProps.groupByDate).toBe(true);
  });

  it('passes groupByDate=false when a specific team is selected', () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);
    const props = gameListMock.mock.calls[0][0];
    expect(props.groupByDate).toBe(false);
  });

  it('passes error to GameList when getAllGames fails', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    getAllGamesMock.mockRejectedValue(new Error('network error'));
    render(<App />);

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(1));

    const selectorProps = teamSelectorMock.mock.calls[0][0];
    act(() => { selectorProps.onSelect(null); });

    await waitFor(() => {
      const latestProps = gameListMock.mock.calls.at(-1)?.[0];
      expect(latestProps).toMatchObject({ games: [], loading: false, error: 'Could not load schedule' });
    });
  });

  it('refetches when selecting the same team again', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(1));

    const selectorProps = teamSelectorMock.mock.calls[0][0];
    act(() => { selectorProps.onSelect('SEA'); });

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(2));
  });

  it('polls every 30 seconds after initial load', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    render(<App />);

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(1));

    const intervalCallback = setIntervalSpy.mock.calls[0][0] as () => void;
    await act(async () => {
      intervalCallback();
    });

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(2));
    setIntervalSpy.mockRestore();
  });

  it('does not set state after unmount when a request resolves late', async () => {
    const pending = deferred<never[]>();
    getTeamScheduleMock.mockReturnValue(pending.promise);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const view = render(<App />);
    view.unmount();

    await act(async () => {
      pending.resolve([]);
      await Promise.resolve();
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('does not set state after unmount when a request rejects late', async () => {
    const pending = deferred<never[]>();
    getTeamScheduleMock.mockReturnValue(pending.promise);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const view = render(<App />);
    view.unmount();

    await act(async () => {
      pending.reject(new Error('late failure'));
      await Promise.resolve();
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
