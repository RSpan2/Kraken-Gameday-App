export interface Game {
  id: string;
  opponent: string;
  opponentAbbrev: string;
  date: string;
  gameTime: string;
  homeAway: 'home' | 'away';
  venue: string;
  status: 'upcoming' | 'live' | 'final';
  teamAbbrev: string;
  teamScore: number | null;
  opponentScore: number | null;
}