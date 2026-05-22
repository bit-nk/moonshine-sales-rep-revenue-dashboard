// Unified brightened palette: gold / blue / terracotta / sage / grey family.
// Same colour for the same dimension across every chart on both pages.
export const PALETTE = {
  gold:  '#D4B85A', // bright warm gold
  blue:  '#4A90E2', // bright crisp blue
  terracotta: '#E2734A', // bright warm terracotta
  sage:  '#7AB892', // bright muted sage
  grey:  '#9AA3B0', // neutral mid grey
} as const;

// Development color map  -  consistent across all charts (gold/blue/terracotta/sage)
export const DEVELOPMENT_COLORS: Record<string, string> = {
  '25 St Audley':  PALETTE.gold,
  '59 East Hertford':  PALETTE.blue,
  '38 on 1st':  PALETTE.terracotta,
  'Development Showcase SPA': PALETTE.sage,
};

const FALLBACK_COLORS = [
  PALETTE.grey,
  '#B57FD1', // soft violet  -  extra differentiation if more developments appear
  '#5BC0BE', // soft cyan
  '#E8C46A', // pale gold variant
];

let fallbackIndex = 0;
const dynamicAssignments = new Map<string, string>();

export function getDevColor(development: string): string {
  if (DEVELOPMENT_COLORS[development]) return DEVELOPMENT_COLORS[development];
  if (dynamicAssignments.has(development)) return dynamicAssignments.get(development)!;
  const color = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
  dynamicAssignments.set(development, color);
  fallbackIndex++;
  return color;
}

export function getDevColorByIndex(index: number): string {
  const all = [
  ...Object.values(DEVELOPMENT_COLORS),
  ...FALLBACK_COLORS,
  ];
  return all[index % all.length];
}

// Search intent colors  -  match the same gold/blue/grey family
export const INTENT_COLORS = {
  branded:  PALETTE.gold,
  highIntent: PALETTE.blue,
  broad:  PALETTE.grey,
};
