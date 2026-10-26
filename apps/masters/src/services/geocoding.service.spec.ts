import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import GeocodingService, {
  GEOCODE_RADIUS_M,
  GEOCODE_TIMEOUT_MS,
} from './geocoding.service';

describe('GeocodingService', () => {
  const vilnius = { lat: 54.6872, lng: 25.2797 };
  const result = {
    lat: 54.6683162,
    lon: 25.2634164,
    address_line1: 'Panerių g. 45',
    rank: { confidence: 0.71 },
  };
  let fetchMock: jest.SpyInstance;
  let service: GeocodingService;

  const respond = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const config = { getOrThrow: jest.fn().mockReturnValue('test-key') };
    service = new GeocodingService(config as unknown as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the coordinates and label of the best result', async () => {
    respond({ results: [result] });

    await expect(service.geocode('Paneriu 45', vilnius)).resolves.toEqual({
      lat: 54.6683162,
      lng: 25.2634164,
      label: 'Panerių g. 45',
    });
  });

  it('limits the search to a circle around the given point', async () => {
    respond({ results: [result] });

    await service.geocode('Paneriu 45', vilnius);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const params = new URL(url).searchParams;
    expect(params.get('text')).toBe('Paneriu 45');
    expect(params.get('filter')).toBe(
      `circle:25.2797,54.6872,${GEOCODE_RADIUS_M}`,
    );
    expect(params.get('bias')).toBe('proximity:25.2797,54.6872');
    expect(params.get('format')).toBe('json');
    expect(params.get('limit')).toBe('1');
    expect(params.get('apiKey')).toBe('test-key');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns null when the match is doubtful', async () => {
    respond({ results: [{ ...result, rank: { confidence: 0.3 } }] });

    await expect(service.geocode('somewhere', vilnius)).resolves.toBeNull();
  });

  it('returns null when nothing is found', async () => {
    respond({ results: [] });

    await expect(service.geocode('atlantis', vilnius)).resolves.toBeNull();
  });

  it('returns null on an HTTP error', async () => {
    respond({ message: 'Invalid apiKey' }, 401);

    await expect(service.geocode('Paneriu 45', vilnius)).resolves.toBeNull();
  });

  it('returns null when the request fails or times out', async () => {
    fetchMock.mockRejectedValue(
      new DOMException(
        `signal timed out after ${GEOCODE_TIMEOUT_MS}ms`,
        'TimeoutError',
      ),
    );

    await expect(service.geocode('Paneriu 45', vilnius)).resolves.toBeNull();
  });
});
