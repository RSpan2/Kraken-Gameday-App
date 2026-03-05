import { Game } from '../types/Game';

const CURRENT_SEASON = '20252026';

interface NHLTeamInGame {
  abbrev: string;
  placeName: { default: string };
  score?: number;
}

interface NHLGameResponse {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  gameState: string;
  homeTeam: NHLTeamInGame;
  awayTeam: NHLTeamInGame;
  venue: {
    default: string;
  };
}

interface NHLScheduleResponse {
  games: NHLGameResponse[];
}

function mapGameState(state: string): 'upcoming' | 'live' | 'final' {
  if (['LIVE', 'CRIT'].includes(state)) return 'live';
  if (['FINAL', 'OFF', 'OFFICIAL'].includes(state)) return 'final';
  return 'upcoming';
}

function buildUrl(teamCode: string, isWeb: boolean): string {
  const apiUrl = `https://api-web.nhle.com/v1/club-schedule-season/${teamCode}/${CURRENT_SEASON}`;
  return isWeb ? `https://corsproxy.io/?${apiUrl}` : apiUrl;
}

function mapGame(game: NHLGameResponse, teamCode: string): Game {
  const isHome = game.homeTeam.abbrev === teamCode;
  const myTeam = isHome ? game.homeTeam : game.awayTeam;
  const theirTeam = isHome ? game.awayTeam : game.homeTeam;
  const status = mapGameState(game.gameState);
  const hasScore = myTeam.score !== undefined && theirTeam.score !== undefined;

  return {
    id: game.id.toString(),
    opponent: theirTeam.placeName.default,
    opponentAbbrev: theirTeam.abbrev,
    date: new Date(game.gameDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    gameTime: new Date(game.startTimeUTC).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    homeAway: isHome ? 'home' : 'away',
    venue: game.venue.default,
    status,
    teamAbbrev: teamCode,
    teamScore: hasScore ? (myTeam.score as number) : null,
    opponentScore: hasScore ? (theirTeam.score as number) : null,
  };
}

export async function getTeamSchedule(teamCode: string): Promise<Game[]> {
  try {
    const isWeb = typeof document !== 'undefined';
    const response = await fetch(buildUrl(teamCode, isWeb));

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    const data: NHLScheduleResponse = await response.json();
    return data.games.map((game) => mapGame(game, teamCode));
  } catch (error) {
    throw new Error('Could not load schedule');
  }
}

export async function getKrakenSchedule(): Promise<Game[]> {
  return getTeamSchedule('SEA');
}