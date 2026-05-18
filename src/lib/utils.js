import { clsx } from 'clsx';
export function cn(...inputs) {
    return clsx(inputs);
}
export const ASSETS = [
    { sym: 'BTC', name: 'Bitcoin', price: 71248.32, change: 2.41, color: '#f7931a' },
    { sym: 'ETH', name: 'Ethereum', price: 3812.07, change: 1.18, color: '#627eea' },
    { sym: 'SOL', name: 'Solana', price: 178.42, change: 4.62, color: '#14f195' },
    { sym: 'XRP', name: 'XRP', price: 0.6128, change: -0.84, color: '#23292f' },
    { sym: 'BNB', name: 'BNB', price: 612.18, change: 0.74, color: '#f3ba2f' },
    { sym: 'ADA', name: 'Cardano', price: 0.4621, change: -1.32, color: '#0033ad' },
    { sym: 'DOGE', name: 'Dogecoin', price: 0.1582, change: 3.27, color: '#c2a633' },
    { sym: 'AVAX', name: 'Avalanche', price: 38.91, change: 1.93, color: '#e84142' },
    { sym: 'DOT', name: 'Polkadot', price: 7.42, change: -0.45, color: '#e6007a' },
    { sym: 'MATIC', name: 'Polygon', price: 0.731, change: 2.05, color: '#8247e5' },
];
export function formatUSD(v, digits = 2) {
    const value = Number.isFinite(Number(v)) ? Number(v) : 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value);
}
export function formatPct(v) {
    const s = v >= 0 ? '+' : '';
    return `${s}${v.toFixed(2)}%`;
}
