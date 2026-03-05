import { Game } from '../types/Game';

const KRAKEN_TEAM_CODE = 'SEA';
const CURRENT_SEASON = '20252026';

interface NHLGameResponse {
  id: number;
  gameDate: string;
  homeTeam: {
    abbrev: string;
    placeName: { default: string };
  };
  awayTeam: {
    abbrev: string;
    placeName: { default: string };
  };
  venue: {
    default: string;
  };
}

interface NHLScheduleResponse {
  games: NHLGameResponse[];
}

export async function getKrakenSchedule(): Promise<Game[]> {
  try {
    const isWeb = typeof document !== 'undefined';
    const baseUrl = isWeb
        ? `https://corsproxy.io/?https://api-web.nhle.com/v1/club-schedule-season/${KRAKEN_TEAM_CODE}/${CURRENT_SEASON}`
        : `https://api-web.nhle.com/v1/club-schedule-season/${KRAKEN_TEAM_CODE}/${CURRENT_SEASON}`;

    const response = await fetch(baseUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    const data: NHLScheduleResponse = await response.json();

    return data.games.map((game: NHLGameResponse) => {
      const isHome = game.homeTeam.abbrev === KRAKEN_TEAM_CODE;
      const opponent = isHome
        ? game.awayTeam.placeName.default
        : game.homeTeam.placeName.default;

      return {
        id: game.id.toString(),
        opponent,
        date: new Date(game.gameDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        homeAway: isHome ? 'home' : 'away',
        venue: game.venue.default,
      };
    });
  } catch (error) {
    throw new Error('Could not load Kraken schedule');
  }
}