import { render, screen } from '@testing-library/react-native';
import GameCard from '../../components/GameCard';

describe('GameCard', () => {
  it('renders home game details', () => {
    render(
      <GameCard
        game={{
          id: '1',
          opponent: 'Canucks',
          date: 'Fri, Jan 10',
          homeAway: 'home',
          venue: 'Climate Pledge Arena',
        }}
      />,
    );

    expect(screen.getByText('vs Canucks')).toBeTruthy();
    expect(screen.getByText('Fri, Jan 10')).toBeTruthy();
    expect(screen.getByText(/Home$/)).toBeTruthy();
    expect(screen.getByText(/Climate Pledge Arena/)).toBeTruthy();
  });

  it('renders away game details', () => {
    render(
      <GameCard
        game={{
          id: '2',
          opponent: 'Flames',
          date: 'Sun, Jan 12',
          homeAway: 'away',
          venue: 'Scotiabank Saddledome',
        }}
      />,
    );

    expect(screen.getByText('vs Flames')).toBeTruthy();
    expect(screen.getByText(/Away$/)).toBeTruthy();
  });
});
