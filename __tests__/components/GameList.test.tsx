import { render, screen } from '@testing-library/react-native';
import GameList from '../../components/GameList';

describe('GameList', () => {
  it('shows a loading message while loading', () => {
    render(<GameList games={[]} loading error={null} />);

    expect(screen.getByText('Loading schedule...')).toBeTruthy();
  });

  it('shows an error message when loading fails', () => {
    render(<GameList games={[]} loading={false} error="Request failed" />);

    expect(screen.getByText(/Request failed/)).toBeTruthy();
  });

  it('renders game cards when data is available', () => {
    const games = [
      {
        id: '1',
        opponent: 'Oilers',
        date: 'Mon, Jan 13',
        homeAway: 'home' as const,
        venue: 'Climate Pledge Arena',
      },
      {
        id: '2',
        opponent: 'Kings',
        date: 'Wed, Jan 15',
        homeAway: 'away' as const,
        venue: 'Crypto.com Arena',
      },
    ];

    render(<GameList games={games} loading={false} error={null} />);

    expect(screen.getByText('vs Oilers')).toBeTruthy();
    expect(screen.getByText('vs Kings')).toBeTruthy();
  });
});
