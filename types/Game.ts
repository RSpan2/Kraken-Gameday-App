export interface Game {
  id: string;
  opponent: string;
  date: string;
  homeAway: 'home' | 'away';
  venue: string;
}