import { getKrakenSchedule, getTeamSchedule, getAllGames } from '../../services/nhlApi';

const makeApiGame = (overrides: {
  id?: number;
  gameDate?: string;
  startTimeUTC?: string;
  gameState?: string;
  homeAbbrev?: string;
  homeName?: string;
  awayAbbrev?: string;
  awayName?: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
} = {}) => ({
  id: overrides.id ?? 1,
  gameDate: overrides.gameDate ?? '2026-01-10',
  startTimeUTC: overrides.startTimeUTC ?? '2026-01-11T03:00:00.000Z',
  gameState: overrides.gameState ?? 'FUT',
  homeTeam: {
    abbrev: overrides.homeAbbrev ?? 'SEA',
    placeName: { default: overrides.homeName ?? 'Seattle' },
    score: overrides.homeScore,
  },
  awayTeam: {
    abbrev: overrides.awayAbbrev ?? 'VAN',
    placeName: { default: overrides.awayName ?? 'Vancouver' },
    score: overrides.awayScore,
  },
  venue: { default: overrides.venue ?? 'Climate Pledge Arena' },
});

function isoDateOffset(daysFromToday: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function mockFetch(games: ReturnType<typeof makeApiGame>[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ games }),
  }) as unknown as typeof fetch;
}

describe('getTeamSchedule', () => {
  const originalFetch = global.fetch;
  const originalDocument = (globalThis as { document?: unknown }).document;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = originalDocument;
    }
    jest.resetAllMocks();
  });

  it('maps a home upcoming game correctly', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ id: 1, gameState: 'FUT' })]);

    const [game] = await getTeamSchedule('SEA');

    expect(game).toMatchObject({
      id: '1',
      opponent: 'Vancouver',
      opponentAbbrev: 'VAN',
      homeAway: 'home',
      status: 'upcoming',
      teamAbbrev: 'SEA',
      teamScore: null,
      opponentScore: null,
    });
  });

  it('maps an away game — opponent is home team', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({
      homeAbbrev: 'COL', homeName: 'Colorado',
      awayAbbrev: 'SEA', awayName: 'Seattle',
      venue: 'Ball Arena',
    })]);

    const [game] = await getTeamSchedule('SEA');

    expect(game).toMatchObject({
      opponent: 'Colorado',
      opponentAbbrev: 'COL',
      homeAway: 'away',
      venue: 'Ball Arena',
    });
  });

  it('maps a final game with scores', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ gameState: 'OFF', homeScore: 4, awayScore: 2 })]);

    const [game] = await getTeamSchedule('SEA');

    expect(game).toMatchObject({ status: 'final', teamScore: 4, opponentScore: 2 });
  });

  it('maps a FINAL game state to final', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ gameState: 'FINAL', homeScore: 3, awayScore: 1 })]);

    const [game] = await getTeamSchedule('SEA');
    expect(game.status).toBe('final');
  });

  it('maps an OFFICIAL game state to final', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ gameState: 'OFFICIAL', homeScore: 2, awayScore: 0 })]);

    const [game] = await getTeamSchedule('SEA');
    expect(game.status).toBe('final');
  });

  it('maps a LIVE game state to live', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ gameState: 'LIVE', homeScore: 1, awayScore: 1 })]);

    const [game] = await getTeamSchedule('SEA');
    expect(game.status).toBe('live');
  });

  it('maps a CRIT game state to live', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ gameState: 'CRIT', homeScore: 3, awayScore: 2 })]);

    const [game] = await getTeamSchedule('SEA');
    expect(game.status).toBe('live');
  });

  it('sets teamScore to null when score is missing', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([makeApiGame({ gameState: 'FUT' })]);

    const [game] = await getTeamSchedule('SEA');
    expect(game.teamScore).toBeNull();
    expect(game.opponentScore).toBeNull();
  });

  it('uses the native URL without CORS proxy', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([]);

    await getTeamSchedule('SEA');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-web.nhle.com/v1/club-schedule-season/SEA/20252026',
    );
  });

  it('uses the CORS proxy on web', async () => {
    (globalThis as { document?: unknown }).document = {};
    mockFetch([]);

    await getTeamSchedule('SEA');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://corsproxy.io/?https://api-web.nhle.com/v1/club-schedule-season/SEA/20252026',
    );
  });

  it('fetches any team by code', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockFetch([]);

    await getTeamSchedule('TOR');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-web.nhle.com/v1/club-schedule-season/TOR/20252026',
    );
  });

  it('throws a friendly error on non-OK response', async () => {
    delete (globalThis as { document?: unknown }).document;
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    await expect(getTeamSchedule('SEA')).rejects.toThrow('Could not load schedule');
  });

  it('throws a friendly error when fetch rejects', async () => {
    delete (globalThis as { document?: unknown }).document;
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;

    await expect(getTeamSchedule('SEA')).rejects.toThrow('Could not load schedule');
  });
});

describe('getAllGames', () => {
  const originalFetch = global.fetch;
  const originalDocument = (globalThis as { document?: unknown }).document;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = originalDocument;
    }
    jest.resetAllMocks();
  });

  function mockLeagueFetch(
    days: { date: string; games: ReturnType<typeof makeApiGame>[] }[],
    options?: {
      nextStartDate?: string;
      regularSeasonEndDate?: string;
      scoreNowOk?: boolean;
      scoreNowGames?: ReturnType<typeof makeApiGame>[];
    },
  ) {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: days,
          nextStartDate: options?.nextStartDate,
          regularSeasonEndDate: options?.regularSeasonEndDate,
        }),
      })
      .mockResolvedValueOnce({
        ok: options?.scoreNowOk ?? true,
        json: async () => ({ games: options?.scoreNowGames ?? [] }),
      }) as unknown as typeof fetch;
  }

  it('flattens games from all days into a single array', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    const tomorrow = isoDateOffset(1);
    mockLeagueFetch([
      { date: today, games: [makeApiGame({ id: 1, gameDate: today, homeAbbrev: 'SEA', awayAbbrev: 'VAN' })] },
      { date: tomorrow, games: [makeApiGame({ id: 2, gameDate: tomorrow, homeAbbrev: 'BOS', awayAbbrev: 'TOR' })] },
    ]);

    const games = await getAllGames();
    expect(games).toHaveLength(2);
    expect(games[0].id).toBe('1');
    expect(games[1].id).toBe('2');
  });

  it('maps home team as the perspective team', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    mockLeagueFetch([
      { date: today, games: [makeApiGame({ gameDate: today, homeAbbrev: 'BOS', homeName: 'Boston', awayAbbrev: 'TOR', awayName: 'Toronto' })] },
    ]);

    const [game] = await getAllGames();
    expect(game.teamAbbrev).toBe('BOS');
    expect(game.opponent).toBe('Toronto');
    expect(game.homeAway).toBe('home');
  });

  it('uses native URL without CORS proxy', async () => {
    delete (globalThis as { document?: unknown }).document;
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameWeek: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [] }),
      }) as unknown as typeof fetch;

    await getAllGames();

    expect(global.fetch).toHaveBeenCalledWith('https://api-web.nhle.com/v1/schedule/now');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://api-web.nhle.com/v1/score/now'));
  });

  it('uses CORS proxy on web', async () => {
    (globalThis as { document?: unknown }).document = {};
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameWeek: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [] }),
      }) as unknown as typeof fetch;

    await getAllGames();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://corsproxy.io/?https://api-web.nhle.com/v1/schedule/now',
    );
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://corsproxy.io/?https://api-web.nhle.com/v1/score/now'));
  });

  it('overlays score/now data onto schedule games by game id', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [
            {
              date: today,
              games: [makeApiGame({ id: 10, gameDate: today, gameState: 'LIVE', homeScore: 1, awayScore: 0 })],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          games: [makeApiGame({ id: 10, gameDate: today, gameState: 'OFF', homeScore: 4, awayScore: 2 })],
        }),
      }) as unknown as typeof fetch;

    const [game] = await getAllGames();
    expect(game.status).toBe('final');
    expect(game.teamScore).toBe(4);
    expect(game.opponentScore).toBe(2);
  });

  it('follows nextStartDate pages on web to include later schedule weeks', async () => {
    (globalThis as { document?: unknown }).document = {};
    const today = isoDateOffset(0);
    const nextWeekStart = isoDateOffset(7);
    const seasonEnd = isoDateOffset(30);
    const nextWeekGameDate = isoDateOffset(8);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [
            {
              date: today,
              games: [makeApiGame({ id: 21, gameDate: today, homeAbbrev: 'SEA', awayAbbrev: 'VAN' })],
            },
          ],
          nextStartDate: nextWeekStart,
          regularSeasonEndDate: seasonEnd,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [
            {
              date: nextWeekGameDate,
              games: [makeApiGame({ id: 22, gameDate: nextWeekGameDate, homeAbbrev: 'BOS', awayAbbrev: 'TOR' })],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [] }),
      }) as unknown as typeof fetch;

    const games = await getAllGames();
    expect(games.map((g) => g.id)).toEqual(['21', '22']);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://corsproxy.io/?https://api-web.nhle.com/v1/schedule/${nextWeekStart}`,
    );
  });

  it('throws when a paged schedule fetch is non-OK', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    const nextWeekStart = isoDateOffset(7);
    const seasonEnd = isoDateOffset(30);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [
            {
              date: today,
              games: [makeApiGame({ id: 31, gameDate: today })],
            },
          ],
          nextStartDate: nextWeekStart,
          regularSeasonEndDate: seasonEnd,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      }) as unknown as typeof fetch;

    await expect(getAllGames()).rejects.toThrow('Could not load schedule');
  });

  it('falls back to team name.default when placeName is missing', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    const gameWithNameOnly = {
      ...makeApiGame({ id: 40, gameDate: today }),
      awayTeam: {
        abbrev: 'VGK',
        name: { default: 'Golden Knights' },
      },
    } as unknown as ReturnType<typeof makeApiGame>;
    mockLeagueFetch([{ date: today, games: [gameWithNameOnly] }]);

    const [game] = await getAllGames();
    expect(game.opponent).toBe('Golden Knights');
  });

  it('falls back to team abbrev when placeName and name are missing', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    const gameWithAbbrevOnly = {
      ...makeApiGame({ id: 41, gameDate: today }),
      awayTeam: {
        abbrev: 'VGK',
      },
    } as unknown as ReturnType<typeof makeApiGame>;
    mockLeagueFetch([{ date: today, games: [gameWithAbbrevOnly] }]);

    const [game] = await getAllGames();
    expect(game.opponent).toBe('VGK');
  });

  it('falls back venue to TBD when venue is missing', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    const gameWithoutVenue = {
      ...makeApiGame({ id: 42, gameDate: today }),
      venue: undefined,
    } as unknown as ReturnType<typeof makeApiGame>;
    mockLeagueFetch([{ date: today, games: [gameWithoutVenue] }]);

    const [game] = await getAllGames();
    expect(game.venue).toBe('TBD');
  });

  it('breaks pagination when nextStartDate repeats', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    const repeatedStartDate = isoDateOffset(7);
    const seasonEnd = isoDateOffset(30);
    const nextWeekDate = isoDateOffset(8);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [{ date: today, games: [makeApiGame({ id: 50, gameDate: today })] }],
          nextStartDate: repeatedStartDate,
          regularSeasonEndDate: seasonEnd,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [{ date: nextWeekDate, games: [makeApiGame({ id: 51, gameDate: nextWeekDate })] }],
          nextStartDate: repeatedStartDate,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [] }),
      }) as unknown as typeof fetch;

    const games = await getAllGames();
    expect(games.map((g) => g.id)).toEqual(['50', '51']);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('returns schedule games when score/now responds with non-OK', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);
    mockLeagueFetch(
      [{ date: today, games: [makeApiGame({ id: 60, gameDate: today, gameState: 'LIVE', homeScore: 1, awayScore: 0 })] }],
      { scoreNowOk: false },
    );

    const [game] = await getAllGames();
    expect(game.id).toBe('60');
    expect(game.status).toBe('live');
  });

  it('handles non-array score/now games payload by falling back to schedule data', async () => {
    delete (globalThis as { document?: unknown }).document;
    const today = isoDateOffset(0);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          gameWeek: [
            {
              date: today,
              games: [makeApiGame({ id: 61, gameDate: today, gameState: 'LIVE', homeScore: 2, awayScore: 1 })],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: { bad: true } }),
      }) as unknown as typeof fetch;

    const [game] = await getAllGames();
    expect(game.id).toBe('61');
    expect(game.status).toBe('live');
    expect(game.teamScore).toBe(2);
  });

  it('throws a friendly error on non-OK response', async () => {
    delete (globalThis as { document?: unknown }).document;
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    await expect(getAllGames()).rejects.toThrow('Could not load schedule');
  });

  it('throws a friendly error when fetch rejects', async () => {
    delete (globalThis as { document?: unknown }).document;
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as unknown as typeof fetch;

    await expect(getAllGames()).rejects.toThrow('Could not load schedule');
  });
});

describe('getKrakenSchedule', () => {
  const originalFetch = global.fetch;
  const originalDocument = (globalThis as { document?: unknown }).document;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = originalDocument;
    }
    jest.resetAllMocks();
  });

  it('delegates to getTeamSchedule with SEA', async () => {
    delete (globalThis as { document?: unknown }).document;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await getKrakenSchedule();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-web.nhle.com/v1/club-schedule-season/SEA/20252026',
    );
  });
});
