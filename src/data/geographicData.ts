export interface LocationData {
  name: string;
  region: string;
  conversions: number;
  coordinates: { x: number; y: number };
}

export const getTotalConversionsByLocation = (data: LocationData[]) =>
  data.reduce((acc, loc) => acc + loc.conversions, 0);

export const getLocationsSorted = (data: LocationData[]) =>
  [...data].sort((a, b) => b.conversions - a.conversions);
