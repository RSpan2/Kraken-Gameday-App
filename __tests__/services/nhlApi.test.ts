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

  function mockLeagueFetch(days: { date: string; games: ReturnType<typeof makeApiGame>[] }[]) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ gameWeek: days }),
    }) as unknown as typeof fetch;
  }

  it('flattens games from all days into a single array', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockLeagueFetch([
      { date: '2026-01-13', games: [makeApiGame({ id: 1, homeAbbrev: 'SEA', awayAbbrev: 'VAN' })] },
      { date: '2026-01-15', games: [makeApiGame({ id: 2, homeAbbrev: 'BOS', awayAbbrev: 'TOR' })] },
    ]);

    const games = await getAllGames();
    expect(games).toHaveLength(2);
    expect(games[0].id).toBe('1');
    expect(games[1].id).toBe('2');
  });

  it('maps home team as the perspective team', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockLeagueFetch([
      { date: '2026-01-13', games: [makeApiGame({ homeAbbrev: 'BOS', homeName: 'Boston', awayAbbrev: 'TOR', awayName: 'Toronto' })] },
    ]);

    const [game] = await getAllGames();
    expect(game.teamAbbrev).toBe('BOS');
    expect(game.opponent).toBe('Toronto');
    expect(game.homeAway).toBe('home');
  });

  it('uses native URL without CORS proxy', async () => {
    delete (globalThis as { document?: unknown }).document;
    mockLeagueFetch([]);

    await getAllGames();

    expect(global.fetch).toHaveBeenCalledWith('https://api-web.nhle.com/v1/schedule/now');
  });

  it('uses CORS proxy on web', async () => {
    (globalThis as { document?: unknown }).document = {};
    mockLeagueFetch([]);

    await getAllGames();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://corsproxy.io/?https://api-web.nhle.com/v1/schedule/now',
    );
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
