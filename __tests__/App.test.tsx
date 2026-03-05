import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import App from '../App';
import GameList from '../components/GameList';
import TeamSelector from '../components/TeamSelector';
import { getTeamSchedule } from '../services/nhlApi';

jest.mock('../services/nhlApi', () => ({
  getTeamSchedule: jest.fn(),
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
  const gameListMock = GameList as unknown as jest.Mock;
  const teamSelectorMock = TeamSelector as unknown as jest.Mock;

  beforeEach(() => {
    getTeamScheduleMock.mockReset();
    gameListMock.mockClear();
    teamSelectorMock.mockClear();
  });

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

  it('does not fetch when All Teams is selected', async () => {
    getTeamScheduleMock.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => expect(getTeamScheduleMock).toHaveBeenCalledTimes(1));

    const selectorProps = teamSelectorMock.mock.calls[0][0];
    selectorProps.onSelect(null);

    await waitFor(() => {
      const latestProps = gameListMock.mock.calls.at(-1)?.[0];
      expect(latestProps).toMatchObject({ games: [], loading: false });
    });

    expect(getTeamScheduleMock).toHaveBeenCalledTimes(1);
  });
});
