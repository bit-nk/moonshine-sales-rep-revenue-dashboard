import React, { useState, useMemo } from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import type { Lead } from '@/hooks/useLeadsData';

const GOLD = '#877F49';
const BG   = 'transparent';
const CARD_BG = 'rgba(20, 20, 20, 0.72)';

// 5-stop rank palette: rank 1 (highest) → rank 5+ (lowest)
const RANK_STOPS = ['#00B4A6', '#2E7D8F', '#4A6FA5', '#8B6914', '#877F49'];

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function getRankColor(value: number, minVal: number, maxVal: number) {
  if (maxVal === minVal) return RANK_STOPS[0];
  // t = 0 at max (rank 1), t = 1 at min (rank last)
  const t = 1 - (value - minVal) / (maxVal - minVal);
  // Map t to 0..4 segment space
  const segment = t * (RANK_STOPS.length - 1);
  const i = Math.min(Math.floor(segment), RANK_STOPS.length - 2);
  const frac = segment - i;
  const [r1, g1, b1] = hexToRgb(RANK_STOPS[i]);
  const [r2, g2, b2] = hexToRgb(RANK_STOPS[i + 1]);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * frac);
  return `rgb(${lerp(r1, r2)},${lerp(g1, g2)},${lerp(b1, b2)})`;
}

interface TreemapCellProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  minVal: number;
  maxVal: number;
  onSelect?: (name: string) => void;
}

function TreemapCell({ x, y, width, height, name, value, minVal, maxVal, onSelect }: TreemapCellProps) {
  const [hovered, setHovered] = useState(false);
  if (!name || !width || !height || width < 4 || height < 4) return null;
  const fill = getRankColor(value, minVal, maxVal);
  const PAD = 8;
  const showContent = width > 44 && height > 38;
  const showAddress = showContent && height > 60;
  const addrFontSize = Math.min(13, Math.max(9, Math.floor(width / 14)));
  const countFontSize = Math.min(22, Math.max(12, Math.floor(width / 8)));
  return (
    <motion.g
      initial={{ x, y }}
      animate={{ x, y: hovered ? y - 4 : y }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        filter: hovered ? 'drop-shadow(0 10px 24px rgba(0,0,0,0.82))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.55))',
        transition: 'filter 0.3s ease',
        cursor: 'pointer',
        willChange: 'transform',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(name)}
    >
      <rect x={1} y={1} width={width - 2} height={height - 2} fill={fill} stroke={GOLD} strokeWidth={1} rx={5} ry={5} />
      {showContent && (
        <foreignObject x={PAD} y={PAD} width={Math.max(1, width - PAD * 2 - 2)} height={Math.max(1, height - PAD * 2 - 2)} style={{ overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, overflow: 'hidden', pointerEvents: 'none', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' }}>
            {showAddress && (
              <p style={{ color: '#ffffff', fontWeight: 700, fontSize: addrFontSize, lineHeight: 1.3, margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', overflow: 'hidden' }}>{name}</p>
            )}
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: countFontSize, margin: 0, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{value}</p>
          </div>
        </foreignObject>
      )}
    </motion.g>
  );
}

interface ListingTreemapProps {
  leads?: Lead[];
  onSelect?: (listingAddress: string) => void;
}

export default function ListingTreemap({ leads, onSelect }: ListingTreemapProps) {
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads;
  }, [leads]);

  const computedData = useMemo(() => {
    if (filteredLeads.length === 0) return null;
    const counts = new Map<string, number>();
    for (const l of filteredLeads) {
      const addr = l.listing_address?.trim();
      if (!addr) continue;
      counts.set(addr, (counts.get(addr) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([listing_address, lead_count]) => ({ listing_address, lead_count }))
      .sort((a, b) => b.lead_count - a.lead_count)
      .slice(0, 10);
  }, [filteredLeads]);

  const validData = computedData && computedData.length > 0 ? computedData : null;
  const countsArr = validData ? validData.map(d => d.lead_count) : [0];
  const minVal = Math.min(...countsArr);
  const maxVal = Math.max(...countsArr);
  const treemapData = validData ? validData.map(d => ({ name: d.listing_address, size: d.lead_count })) : [];

  const renderContent = (props: any) => {
    const { x, y, width, height, name, depth } = props;
    const value = props.value ?? props.size ?? 0;
    if (depth === 0 || !name) return <g />;
    return <TreemapCell x={x} y={y} width={width} height={height} name={name} value={value} minVal={minVal} maxVal={maxVal} onSelect={onSelect} />;
  };

  if (!validData) {
    return (
      <div style={{ background: BG, padding: 24, borderRadius: 16 }}>
        <div style={{ background: CARD_BG, backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: `1px solid rgba(135, 127, 73, 0.45)`, borderRadius: 16, padding: '24px 24px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ color: '#ffffff', fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '0.03em', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Leads by Program</h2>
          </div>
          <div style={{ minHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: GOLD, opacity: 0.45, fontSize: 14, margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>No listing data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Build gradient legend from the 5 stops
  const legendGradient = `linear-gradient(to right, ${RANK_STOPS.join(', ')})`;

  return (
    <div style={{ background: BG, padding: 24, borderRadius: 16 }}>
      <div style={{ background: CARD_BG, backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: `1px solid rgba(135, 127, 73, 0.45)`, borderRadius: 16, padding: '24px 24px 20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ color: '#ffffff', fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '0.03em', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Leads by Program</h2>
            <span style={{ color: GOLD, fontSize: 12, opacity: 0.65, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{validData.length} {validData.length === 1 ? 'property' : 'properties'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 80, height: 5, borderRadius: 3, background: legendGradient, flexShrink: 0 }} />
          <span style={{ color: RANK_STOPS[0], fontSize: 10, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Most leads</span>
          <span style={{ color: '#555', fontSize: 10 }}>›</span>
          <span style={{ color: RANK_STOPS[4], fontSize: 10, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Fewest leads</span>
        </div>
        <ResponsiveContainer width="100%" height={440}>
          <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} content={renderContent as any} isAnimationActive={false} />
        </ResponsiveContainer>
      </div>
    </div>
  );
}
