import { haversineKm } from './haversine';

describe('haversineKm', () => {
  const vilnius = { lat: 54.6872, lng: 25.2797 };
  const kaunas = { lat: 54.8985, lng: 23.9036 };
  const riga = { lat: 56.9496, lng: 24.1052 };

  it('returns 0 for the same point', () => {
    expect(haversineKm(vilnius, vilnius)).toBe(0);
  });

  it('returns the great-circle distance in kilometres', () => {
    // Vilnius–Kaunas is about 92 km, Vilnius–Riga about 262 km.
    expect(haversineKm(vilnius, kaunas)).toBeCloseTo(92, -1);
    expect(haversineKm(vilnius, riga)).toBeCloseTo(262, -1);
  });

  it('is symmetric', () => {
    expect(haversineKm(vilnius, riga)).toBeCloseTo(haversineKm(riga, vilnius));
  });

  it('handles antipodal points', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })).toBeCloseTo(
      Math.PI * 6371,
    );
  });
});
