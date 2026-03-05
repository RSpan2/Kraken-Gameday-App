import { render, screen, fireEvent } from '@testing-library/react-native';
import GameList from '../../components/GameList';
import { Game } from '../../types/Game';

const makeGame = (overrides: Partial<Game> & { id: string; opponent: string }): Game => ({
  opponentAbbrev: 'OPP',
  date: 'Mon, Jan 13',
  gameTime: '7:00 PM',
  homeAway: 'home',
  venue: 'Climate Pledge Arena',
  status: 'upcoming',
  teamAbbrev: 'SEA',
  teamScore: null,
  opponentScore: null,
  ...overrides,
});

const UPCOMING_GAMES: Game[] = [
  makeGame({ id: '1', opponent: 'Oilers', status: 'upcoming' }),
  makeGame({ id: '2', opponent: 'Kings', date: 'Wed, Jan 15', homeAway: 'away', venue: 'Crypto.com Arena', status: 'upcoming' }),
];

const FINAL_GAMES: Game[] = [
  makeGame({ id: '3', opponent: 'Flames', date: 'Sat, Jan 4', status: 'final', teamScore: 4, opponentScore: 2, opponentAbbrev: 'CGY' }),
];

describe('GameList', () => {
  it('shows a loading message while loading', () => {
    render(<GameList games={[]} loading error={null} tab="upcoming" onTabChange={jest.fn()} />);
    expect(screen.getByText('Loading schedule...')).toBeTruthy();
  });

  it('shows an error message when loading fails', () => {
    render(<GameList games={[]} loading={false} error="Request failed" tab="upcoming" onTabChange={jest.fn()} />);
    expect(screen.getByText(/Request failed/)).toBeTruthy();
  });

  it('renders upcoming game cards', () => {
    render(<GameList games={UPCOMING_GAMES} loading={false} error={null} tab="upcoming" onTabChange={jest.fn()} />);
    expect(screen.getByText('vs Oilers')).toBeTruthy();
    expect(screen.getByText('vs Kings')).toBeTruthy();
  });

  it('renders previous game cards', () => {
    render(<GameList games={FINAL_GAMES} loading={false} error={null} tab="previous" onTabChange={jest.fn()} />);
    expect(screen.getByText('vs Flames')).toBeTruthy();
  });

  it('calls onTabChange when Previous tab is pressed', () => {
    const onTabChange = jest.fn();
    render(<GameList games={[]} loading={false} error={null} tab="upcoming" onTabChange={onTabChange} />);
    fireEvent.press(screen.getByText('Previous'));
    expect(onTabChange).toHaveBeenCalledWith('previous');
  });

  it('calls onTabChange when Upcoming tab is pressed', () => {
    const onTabChange = jest.fn();
    render(<GameList games={[]} loading={false} error={null} tab="previous" onTabChange={onTabChange} />);
    fireEvent.press(screen.getByText('Upcoming'));
    expect(onTabChange).toHaveBeenCalledWith('upcoming');
  });

  it('marks the first upcoming game as next game', () => {
    render(<GameList games={UPCOMING_GAMES} loading={false} error={null} tab="upcoming" onTabChange={jest.fn()} />);
    expect(screen.getByText('NEXT GAME')).toBeTruthy();
  });

  it('does not show NEXT GAME label when there are no upcoming games', () => {
    render(<GameList games={FINAL_GAMES} loading={false} error={null} tab="upcoming" onTabChange={jest.fn()} />);
    expect(screen.queryByText('NEXT GAME')).toBeNull();
  });

  it('shows date headers when groupByDate is true', () => {
    const games = [
      makeGame({ id: '1', opponent: 'Oilers', date: 'Mon, Jan 13' }),
      makeGame({ id: '2', opponent: 'Kings', date: 'Wed, Jan 15' }),
    ];
    render(<GameList games={games} loading={false} error={null} tab="upcoming" onTabChange={jest.fn()} groupByDate />);
    expect(screen.getByText('Mon, Jan 13')).toBeTruthy();
    expect(screen.getByText('Wed, Jan 15')).toBeTruthy();
  });

  it('groups games under their date header when groupByDate is true', () => {
    const games = [
      makeGame({ id: '1', opponent: 'Oilers', opponentAbbrev: 'EDM', date: 'Mon, Jan 13' }),
      makeGame({ id: '2', opponent: 'Kings', opponentAbbrev: 'LAK', date: 'Mon, Jan 13' }),
    ];
    render(<GameList games={games} loading={false} error={null} tab="upcoming" onTabChange={jest.fn()} groupByDate />);
    expect(screen.getByText('SEA vs EDM')).toBeTruthy();
    expect(screen.getByText('SEA vs LAK')).toBeTruthy();
  });

  it('hides Upcoming/Previous tabs when groupByDate is true', () => {
    render(<GameList games={[]} loading={false} error={null} tab="upcoming" onTabChange={jest.fn()} groupByDate />);
    expect(screen.queryByText('Upcoming')).toBeNull();
    expect(screen.queryByText('Previous')).toBeNull();
  });
});
