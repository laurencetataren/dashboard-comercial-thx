export const BRAND = {
  primary: "#00D4AA",
  primaryDark: "#00B894",
  secondary: "#6C5CE7",
  accent: "#FD79A8",
  warning: "#FDCB6E",
  danger: "#FF6B6B",
  success: "#00B894",
  bg: "#0A0E1A",
  bgCard: "#111827",
  bgCardHover: "#1a2332",
  bgSurface: "#1E293B",
  border: "#1E293B",
  borderLight: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textDim: "#64748B",
} as const;

export const STAGE_COLORS = [
  "#00D4AA", "#6C5CE7", "#3B82F6", "#F59E0B", "#EF4444",
  "#EC4899", "#8B5CF6", "#14B8A6", "#F97316", "#06B6D4",
  "#84CC16", "#A855F7",
];

export function formatCurrency(val: number): string {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
  return `R$ ${val}`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString("pt-BR");
}
