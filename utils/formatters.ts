export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const hDisplay = h < 10 ? `0${h}` : h;
  const mDisplay = m < 10 ? `0${m}` : m;
  const sDisplay = s < 10 ? `0${s}` : s;
  
  return `${hDisplay}:${mDisplay}:${sDisplay}`;
};
