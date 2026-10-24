import { sortOrigin } from './origin';

describe('sortOrigin', () => {
  const centre = { lat: 54.6872, lng: 25.2797 };

  it('uses the location when lat and lng are both given', () => {
    expect(sortOrigin({ lat: 54.7, lng: 25.3 }, centre)).toEqual({
      lat: 54.7,
      lng: 25.3,
    });
  });

  it('accepts zero coordinates as a location', () => {
    expect(sortOrigin({ lat: 0, lng: 0 }, centre)).toEqual({ lat: 0, lng: 0 });
  });

  it('falls back when the location is missing or partial', () => {
    expect(sortOrigin({}, centre)).toEqual(centre);
    expect(sortOrigin({ lat: 54.7 }, centre)).toEqual(centre);
  });

  it('returns only the coordinates of the fallback', () => {
    expect(sortOrigin({}, { ...centre, id: 1 } as typeof centre)).toEqual(
      centre,
    );
  });
});
