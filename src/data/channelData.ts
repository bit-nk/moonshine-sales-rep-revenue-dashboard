export interface ChannelData {
  channel: string;
  spend: number;
  role: 'capture' | 'creation';
  roleDescription: string;
  metrics: {
    label: string;
    value: number | string;
  }[];
}

export const getTotalChannelSpend = (data: ChannelData[]) =>
  data.reduce((acc, item) => acc + item.spend, 0);

export const getChannelSpendShare = (data: ChannelData[], channel: string) => {
  const total = getTotalChannelSpend(data);
  const channelSpend = data.find(c => c.channel === channel)?.spend || 0;
  return total > 0 ? (channelSpend / total) * 100 : 0;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);
