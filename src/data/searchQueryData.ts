export interface SearchQueryData {
  query: string;
  queryType: 'Branded' | 'Generic High Intent';
  spend: number;
  conversions: number;
  area: string;
  insight: string;
}

export const getTopSearchQueries = (data: SearchQueryData[], limit: number = 10) =>
  data.slice(0, limit);

export const getBrandedQueries = (data: SearchQueryData[]) =>
  data.filter(q => q.queryType === "Branded");

export const getGenericQueries = (data: SearchQueryData[]) =>
  data.filter(q => q.queryType === "Generic High Intent");

export const getTotalBrandedConversions = (data: SearchQueryData[]) =>
  getBrandedQueries(data).reduce((acc, q) => acc + q.conversions, 0);

export const getTotalGenericConversions = (data: SearchQueryData[]) =>
  getGenericQueries(data).reduce((acc, q) => acc + q.conversions, 0);
