import { Game } from '../types/Game';

const CURRENT_SEASON = '20252026';

interface NHLTeamInGame {
  abbrev: string;
  placeName?: { default: string };
  name?: { default: string };
  score?: number;
}

interface NHLGameResponse {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  gameState: string;
  homeTeam: NHLTeamInGame;
  awayTeam: NHLTeamInGame;
  venue?: {
    default: string;
  };
}

interface NHLScheduleResponse {
  games: NHLGameResponse[];
}

interface NHLScheduleDay {
  date: string;
  games: NHLGameResponse[];
}

interface NHLLeagueScheduleResponse {
  nextStartDate?: string;
  regularSeasonEndDate?: string;
  gameWeek: NHLScheduleDay[];
}

function mapGameState(state: string): 'upcoming' | 'live' | 'final' {
  if (['LIVE', 'CRIT'].includes(state)) return 'live';
  if (['FINAL', 'OFF', 'OFFICIAL'].includes(state)) return 'final';
  return 'upcoming';
}

function buildTeamUrl(teamCode: string, isWeb: boolean): string {
  const apiUrl = `https://api-web.nhle.com/v1/club-schedule-season/${teamCode}/${CURRENT_SEASON}`;
  return isWeb ? `https://corsproxy.io/?${apiUrl}` : apiUrl;
}

function buildLeagueNowUrl(isWeb: boolean): string {
  const apiUrl = 'https://api-web.nhle.com/v1/schedule/now';
  return isWeb ? `https://corsproxy.io/?${apiUrl}` : apiUrl;
}

function buildLeagueWeekUrl(startDate: string, isWeb: boolean): string {
  const apiUrl = `https://api-web.nhle.com/v1/schedule/${startDate}`;
  return isWeb ? `https://corsproxy.io/?${apiUrl}` : apiUrl;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getTeamName(team: NHLTeamInGame): string {
  return team.placeName?.default ?? team.name?.default ?? team.abbrev;
}

function mapGame(game: NHLGameResponse, teamCode: string, dateStr?: string): Game {
  const isHome = game.homeTeam.abbrev === teamCode;
  const myTeam = isHome ? game.homeTeam : game.awayTeam;
  const theirTeam = isHome ? game.awayTeam : game.homeTeam;
  const status = mapGameState(game.gameState);
  const hasScore = myTeam.score !== undefined && theirTeam.score !== undefined;

  return {
    id: game.id.toString(),
    opponent: getTeamName(theirTeam),
    opponentAbbrev: theirTeam.abbrev,
    date: formatDate(dateStr ?? game.gameDate),
    gameTime: new Date(game.startTimeUTC).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    homeAway: isHome ? 'home' : 'away',
    venue: game.venue?.default ?? 'TBD',
    status,
    teamAbbrev: teamCode,
    teamScore: hasScore ? (myTeam.score as number) : null,
    opponentScore: hasScore ? (theirTeam.score as number) : null,
  };
}

function isOnOrAfterToday(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const gameDate = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return gameDate >= today;
}

export async function getTeamSchedule(teamCode: string): Promise<Game[]> {
  try {
    const isWeb = typeof document !== 'undefined';
    const response = await fetch(buildTeamUrl(teamCode, isWeb));

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    const data: NHLScheduleResponse = await response.json();
    return data.games.map((game) => mapGame(game, teamCode));
  } catch {
    throw new Error('Could not load schedule');
  }
}

export async function getKrakenSchedule(): Promise<Game[]> {
  return getTeamSchedule('SEA');
}

export async function getAllGames(): Promise<Game[]> {
  try {
    const isWeb = typeof document !== 'undefined';
    const response = await fetch(buildLeagueNowUrl(isWeb));

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    const firstPage: NHLLeagueScheduleResponse = await response.json();
    const allDays: NHLScheduleDay[] = [...firstPage.gameWeek];
    const visitedStartDates = new Set<string>();

    let nextStartDate = firstPage.nextStartDate;
    const regularSeasonEndDate = firstPage.regularSeasonEndDate;

    while (nextStartDate && regularSeasonEndDate && nextStartDate <= regularSeasonEndDate) {
      if (visitedStartDates.has(nextStartDate)) break;
      visitedStartDates.add(nextStartDate);

      const weekResponse = await fetch(buildLeagueWeekUrl(nextStartDate, isWeb));
      if (!weekResponse.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const weekData: NHLLeagueScheduleResponse = await weekResponse.json();
      allDays.push(...weekData.gameWeek);
      nextStartDate = weekData.nextStartDate;
    }

    return allDays
      .filter((day) => isOnOrAfterToday(day.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap((day) =>
        day.games.map((game) => mapGame(game, game.homeTeam.abbrev, day.date)),
      );
  } catch {
    throw new Error('Could not load schedule');
  }
}
