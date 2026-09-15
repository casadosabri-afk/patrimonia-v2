/** Palette catégorielle PATRIMONIA, lisible en mode clair comme en mode sombre. */
export const CHART_COLORS = [
  '#00a97f',
  '#4152ab',
  '#f0a95e',
  '#2f5fd0',
  '#d1656f',
  '#59d6b2',
  '#8d9cdd',
  '#b5741a',
  '#6e7a94',
  '#93e7ce',
] as const;

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] as string;
}

export const AXIS_STYLE = {
  fontSize: 11,
  fill: 'var(--color-fg-subtle)',
} as const;

export const GRID_COLOR = 'var(--color-border)';
