import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';
import GameList from '../components/GameList';
import { getKrakenSchedule } from '../services/nhlApi';

jest.mock('../services/nhlApi', () => ({
  getKrakenSchedule: jest.fn(),
}));

jest.mock('../components/GameList', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe('App', () => {
  const getKrakenScheduleMock = getKrakenSchedule as jest.MockedFunction<
    typeof getKrakenSchedule
  >;
  const gameListMock = GameList as unknown as jest.Mock;

  beforeEach(() => {
    getKrakenScheduleMock.mockReset();
    gameListMock.mockClear();
  });

  it('loads schedule and passes success state to GameList', async () => {
    const games = [
      {
        id: '1',
        opponent: 'Canucks',
        date: 'Fri, Jan 10',
        homeAway: 'home' as const,
        venue: 'Climate Pledge Arena',
      },
    ];
    getKrakenScheduleMock.mockResolvedValue(games);

    render(<App />);

    expect(screen.getByText(/Kraken GameDay/)).toBeTruthy();
    expect(getKrakenScheduleMock).toHaveBeenCalled();
    expect(gameListMock).toHaveBeenCalled();

    const initialProps = gameListMock.mock.calls[0][0];
    expect(initialProps).toMatchObject({
      games: [],
      loading: true,
      error: null,
    });

    await waitFor(() => {
      const latestProps = gameListMock.mock.calls.at(-1)?.[0];
      expect(latestProps).toMatchObject({
        games,
        loading: false,
        error: null,
      });
    });
  });

  it('passes error state to GameList when loading fails', async () => {
    getKrakenScheduleMock.mockRejectedValue(new Error('request failed'));

    render(<App />);

    await waitFor(() => {
      const latestProps = gameListMock.mock.calls.at(-1)?.[0];
      expect(latestProps).toMatchObject({
        games: [],
        loading: false,
        error: 'Could not load Kraken schedule',
      });
    });
  });
});
