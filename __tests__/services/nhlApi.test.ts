import { getKrakenSchedule } from '../../services/nhlApi';

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

  it('maps home and away games for native requests', async () => {
    delete (globalThis as { document?: unknown }).document;

    const games = [
      {
        id: 1,
        gameDate: '2026-01-10T03:00:00.000Z',
        homeTeam: {
          abbrev: 'SEA',
          placeName: { default: 'Seattle' },
        },
        awayTeam: {
          abbrev: 'VAN',
          placeName: { default: 'Vancouver' },
        },
        venue: {
          default: 'Climate Pledge Arena',
        },
      },
      {
        id: 2,
        gameDate: '2026-01-11T03:00:00.000Z',
        homeTeam: {
          abbrev: 'COL',
          placeName: { default: 'Colorado' },
        },
        awayTeam: {
          abbrev: 'SEA',
          placeName: { default: 'Seattle' },
        },
        venue: {
          default: 'Ball Arena',
        },
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games }),
    }) as unknown as typeof fetch;

    const schedule = await getKrakenSchedule();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-web.nhle.com/v1/club-schedule-season/SEA/20252026',
    );
    expect(schedule).toEqual([
      {
        id: '1',
        opponent: 'Vancouver',
        date: new Date(games[0].gameDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        homeAway: 'home',
        venue: 'Climate Pledge Arena',
      },
      {
        id: '2',
        opponent: 'Colorado',
        date: new Date(games[1].gameDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        homeAway: 'away',
        venue: 'Ball Arena',
      },
    ]);
  });

  it('uses the web CORS proxy when document is defined', async () => {
    (globalThis as { document?: unknown }).document = {};

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ games: [] }),
    }) as unknown as typeof fetch;

    await getKrakenSchedule();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://corsproxy.io/?https://api-web.nhle.com/v1/club-schedule-season/SEA/20252026',
    );
  });

  it('throws a friendly error when the API responds with a non-OK status', async () => {
    delete (globalThis as { document?: unknown }).document;

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    await expect(getKrakenSchedule()).rejects.toThrow('Could not load Kraken schedule');
  });

  it('throws a friendly error when fetch rejects', async () => {
    delete (globalThis as { document?: unknown }).document;

    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network error')) as unknown as typeof fetch;

    await expect(getKrakenSchedule()).rejects.toThrow('Could not load Kraken schedule');
  });
});
