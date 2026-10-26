import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Coordinates } from '../utils/haversine';

const GEOCODE_URL = 'https://api.geoapify.com/v1/geocode/search';
// Only places within this circle around the city count. Without it a vague
// place resolves to another city (a Minsk metro station → Saint Petersburg).
export const GEOCODE_RADIUS_M = 30000;
// Geoapify's 0..1 match score; below this the match is doubtful.
export const GEOCODE_MIN_CONFIDENCE = 0.5;
export const GEOCODE_TIMEOUT_MS = 3000;

export type GeocodedPlace = Coordinates & {
  label: string; // e.g. "Panerių g. 45"
};

type GeoapifyResult = {
  lat: number;
  lon: number;
  address_line1: string;
  rank: { confidence: number };
};

type GeoapifyResponse = { results: GeoapifyResult[] };

// Geoapify free plan: Geoapify and OpenStreetMap attribution must be shown
// wherever a result is used. Results are not stored: the terms say nothing
// about caching. No Prisma here, so this can move to a separate search service.
@Injectable()
class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('GEOAPIFY_API_KEY');
  }

  // Never throws: a failure or a doubtful match is null, so search still works.
  async geocode(
    text: string,
    near: Coordinates,
  ): Promise<GeocodedPlace | null> {
    const params = new URLSearchParams({
      text,
      filter: `circle:${near.lng},${near.lat},${GEOCODE_RADIUS_M}`,
      bias: `proximity:${near.lng},${near.lat}`,
      format: 'json',
      limit: '1',
      apiKey: this.apiKey,
    });

    try {
      const response = await fetch(`${GEOCODE_URL}?${params.toString()}`, {
        signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Geoapify responded ${response.status}`);
        return null;
      }

      const { results } = (await response.json()) as GeoapifyResponse;
      const [result] = results;
      if (!result || result.rank.confidence < GEOCODE_MIN_CONFIDENCE) {
        return null;
      }

      return { lat: result.lat, lng: result.lon, label: result.address_line1 };
    } catch (error) {
      this.logger.warn(`Geoapify request failed: ${String(error)}`);
      return null;
    }
  }
}

export default GeocodingService;
