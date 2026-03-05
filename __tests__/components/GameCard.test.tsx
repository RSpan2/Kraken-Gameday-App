import { render, screen } from '@testing-library/react-native';
import GameCard from '../../components/GameCard';
import { Game } from '../../types/Game';

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: '1',
  opponent: 'Canucks',
  opponentAbbrev: 'VAN',
  date: 'Fri, Jan 10',
  gameTime: '7:00 PM',
  homeAway: 'home',
  venue: 'Climate Pledge Arena',
  status: 'upcoming',
  teamAbbrev: 'SEA',
  teamScore: null,
  opponentScore: null,
  ...overrides,
});

describe('GameCard', () => {
  it('renders an upcoming home game', () => {
    render(<GameCard game={makeGame()} />);

    expect(screen.getByText('vs Canucks')).toBeTruthy();
    expect(screen.getByText('Fri, Jan 10 · 7:00 PM')).toBeTruthy();
    expect(screen.getByText(/Home$/)).toBeTruthy();
    expect(screen.getByText(/Climate Pledge Arena/)).toBeTruthy();
  });

  it('renders an upcoming away game', () => {
    render(<GameCard game={makeGame({ homeAway: 'away', opponent: 'Flames', venue: 'Scotiabank Saddledome' })} />);

    expect(screen.getByText('vs Flames')).toBeTruthy();
    expect(screen.getByText(/Away$/)).toBeTruthy();
  });

  it('renders a live game with score and LIVE badge', () => {
    render(
      <GameCard
        game={makeGame({ status: 'live', teamAbbrev: 'SEA', teamScore: 2, opponentScore: 1, opponentAbbrev: 'VAN' })}
      />,
    );

    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText('SEA 2 · VAN 1')).toBeTruthy();
  });

  it('renders a live game with the correct non-Kraken team abbrev', () => {
    render(
      <GameCard
        game={makeGame({ status: 'live', teamAbbrev: 'STL', teamScore: 2, opponentScore: 1, opponentAbbrev: 'SEA' })}
      />,
    );

    expect(screen.getByText('STL 2 · SEA 1')).toBeTruthy();
  });

  it('renders a final game with score and FINAL label', () => {
    render(
      <GameCard
        game={makeGame({ status: 'final', teamAbbrev: 'SEA', teamScore: 4, opponentScore: 3, opponentAbbrev: 'VAN' })}
      />,
    );

    expect(screen.getByText('FINAL')).toBeTruthy();
    expect(screen.getByText('SEA 4 · VAN 3')).toBeTruthy();
  });

  it('shows NEXT GAME label when isNextGame is true', () => {
    render(<GameCard game={makeGame()} isNextGame />);
    expect(screen.getByText('NEXT GAME')).toBeTruthy();
  });

  it('does not show NEXT GAME label by default', () => {
    render(<GameCard game={makeGame()} />);
    expect(screen.queryByText('NEXT GAME')).toBeNull();
  });
});
