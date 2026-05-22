export interface DevelopmentData {
  development: string;
  channel: string;
  spend: number;
  conversions: number;
  costPerConversion: number | null;
  notes: string;
  category: 'primary' | 'resale' | 'awareness';
}

export const getTotalSpend = (data: DevelopmentData[]) => 
  data.reduce((acc, item) => acc + item.spend, 0);

export const getTotalConversions = (data: DevelopmentData[]) => 
  data.reduce((acc, item) => acc + item.conversions, 0);

export const getAverageCostPerConversion = (data: DevelopmentData[]) => {
  const itemsWithConversions = data.filter(item => item.conversions > 0);
  if (itemsWithConversions.length === 0) return 0;
  const totalSpend = itemsWithConversions.reduce((acc, item) => acc + item.spend, 0);
  const totalConversions = itemsWithConversions.reduce((acc, item) => acc + item.conversions, 0);
  return totalSpend / totalConversions;
};

export const getTopPerformingDevelopment = (data: DevelopmentData[]) => {
  const sorted = data
    .filter(item => item.conversions > 0)
    .sort((a, b) => b.conversions - a.conversions);
  return sorted.length > 0 ? sorted[0].development : null;
};

export const getGoogleAdsData = (data: DevelopmentData[]) => 
  data.filter(item => item.channel === "Google Search");

export const getMetaData = (data: DevelopmentData[]) => 
  data.filter(item => item.channel === "Meta");

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
