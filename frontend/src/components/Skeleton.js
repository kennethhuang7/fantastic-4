/**
 * Skeleton.js — Animated skeleton loading components
 *
 * Each exported page skeleton exactly mirrors the real page's component
 * structure, sizes, and spacing so the layout doesn't shift on load.
 */

import React from 'react';

// ── Inject shimmer keyframe once ─────────────────────────────────────────────
const STYLE_ID = 'nc-skeleton-style';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes nc-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .nc-sk {
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        var(--border) 25%,
        var(--bg-primary) 50%,
        var(--border) 75%
      );
      background-size: 1200px 100%;
      animation: nc-shimmer 1.4s ease-in-out infinite;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Sk({ h = 14, w = '100%', r = 6, style: extra = {} }) {
  return <div className="nc-sk" style={{ height: h, width: w, borderRadius: r, ...extra }} />;
}

// Mirrors .stat-box: border-left accent, padding 16px 20px
function SkStatBox() {
  return (
    <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Sk h={11} w="55%" />
      <Sk h={28} w="65%" />
    </div>
  );
}

// Mirrors a .card with a section-title + chart area
function SkChartCard({ title_w = '45%', height = 220, style: extra = {} }) {
  return (
    <div className="card" style={extra}>
      <Sk h={17} w={title_w} style={{ marginBottom: 16 }} />
      <Sk h={height} r={8} />
    </div>
  );
}

// Mirrors a .card with section-title on left and a small control on right
function SkChartCardWithControl({ title_w = '45%', height = 220, style: extra = {} }) {
  return (
    <div className="card" style={extra}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Sk h={17} w={title_w} />
        <Sk h={28} w={70} r={6} />
      </div>
      <Sk h={height} r={8} />
    </div>
  );
}

// Mirrors a table: header row (col widths vary) + N body rows
// colWidths: array of CSS width strings, length = number of columns
function SkTable({ rows = 6, colWidths, rowHeight = 44 }) {
  const cols = colWidths || ['30%', '15%', '15%', '15%'];
  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: '2px solid var(--border)' }}>
        {cols.map((w, i) => <Sk key={i} h={11} w={w} />)}
      </div>
      {/* body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'flex', gap: 8, padding: '0 12px',
            height: rowHeight,
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            background: r % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)',
          }}
        >
          {cols.map((w, i) => <Sk key={i} h={12} w={w} />)}
        </div>
      ))}
    </div>
  );
}

// ── Page skeletons ────────────────────────────────────────────────────────────

// HomeView:
//   date range line | 3 guaranteed stat boxes (Total Revenue has an extra sub-line; 4th is conditional on monthly_revenue existing)
//   grid-2: Monthly Revenue Trend (title+year) / Order Status Breakdown
//   grid-2: Top Categories / Monthly Order Volume (title+year)
//   Recent Orders table: 6 cols, 5 rows
export function HomeSkeleton() {
  return (
    <>
      <Sk h={13} w={260} style={{ marginBottom: 20 }} />

      <div className="stat-row">
        {/* Total Revenue — has label + value + sub-line */}
        <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Sk h={11} w="55%" />
          <Sk h={28} w="65%" />
          <Sk h={11} w="80%" />
        </div>
        {/* Total Orders */}
        <SkStatBox />
        {/* Unique Customers */}
        <SkStatBox />
        {/* Last month revenue — label + value + MoM % line (conditional but almost always present) */}
        <div className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Sk h={11} w="70%" />
          <Sk h={28} w="55%" />
          <Sk h={11} w="60%" />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Monthly Revenue Trend — title + year badge on right */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <Sk h={17} w="55%" /><Sk h={12} w={32} />
          </div>
          <Sk h={220} r={8} />
        </div>
        {/* Order Status Breakdown */}
        <SkChartCard title_w="50%" height={220} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Top Categories */}
        <SkChartCard title_w="50%" height={220} />
        {/* Monthly Order Volume — title + year badge on right */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <Sk h={17} w="55%" /><Sk h={12} w={32} />
          </div>
          <Sk h={220} r={8} />
        </div>
      </div>

      {/* Recent Orders — 6 cols: Order ID | Date | Customer | Product | Amount | Status */}
      <div className="card">
        <Sk h={17} w="25%" style={{ marginBottom: 16 }} />
        <SkTable rows={5} colWidths={['12%', '12%', '20%', '26%', '14%', '12%']} rowHeight={44} />
      </div>
    </>
  );
}

// OrdersView:
//   2 stat boxes | card(Monthly Revenue h=260) | card(Revenue by City h=320)
export function OrdersSkeleton() {
  return (
    <>
      <div className="stat-row">
        <SkStatBox /><SkStatBox />
      </div>
      <SkChartCard title_w="35%" height={260} style={{ marginBottom: 20 }} />
      <SkChartCard title_w="30%" height={320} />
    </>
  );
}

// ProductsView:
//   grid-2: card(title+control, chart h=300) | card(title, table 4-col 10 rows)
export function ProductsSkeleton() {
  return (
    <div className="grid-2">
      <SkChartCardWithControl title_w="55%" height={300} />
      <div className="card">
        <Sk h={17} w="40%" style={{ marginBottom: 16 }} />
        {/* 4 cols: Name | Category | Units Sold | Revenue — row height matches padding:8px + font:14px */}
        <SkTable rows={10} colWidths={['38%', '24%', '18%', '14%']} rowHeight={38} />
      </div>
    </div>
  );
}

// CustomersView:
//   single card: header(title + show-input) | table 5-col 20 rows
export function CustomersSkeleton() {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Sk h={17} w="40%" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sk h={13} w={35} /><Sk h={32} w={70} r={6} />
        </div>
      </div>
      {/* 5 cols: Name | City | State | Orders | Total Spent — row height matches padding:10px */}
      <SkTable rows={20} colWidths={['32%', '20%', '10%', '14%', '18%']} rowHeight={44} />
    </div>
  );
}

// CustomerHistoryView (modal panel):
//   card(email + city/state row, 3 stat-boxes) | card(address table 5-col 2 rows) | card(order table 7-col 10 rows)
export function CustomerHistorySkeleton() {
  return (
    <>
      {/* Profile stats card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Sk h={12} w="35%" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <Sk h={12} w={120} /><Sk h={11} w={90} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="stat-box" style={{ minWidth: 110, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Sk h={11} w="55%" /><Sk h={28} w="65%" />
          </div>
          <div className="stat-box" style={{ minWidth: 110, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Sk h={11} w="55%" /><Sk h={28} w="65%" />
          </div>
          <div className="stat-box" style={{ minWidth: 110, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Sk h={11} w="55%" /><Sk h={28} w="65%" />
          </div>
        </div>
      </div>

      {/* Address history card — 5 cols, ~2 rows typical */}
      <div className="card" style={{ marginBottom: 16 }}>
        <Sk h={17} w="50%" style={{ marginBottom: 12 }} />
        <SkTable rows={2} colWidths={['20%', '10%', '20%', '20%', '18%']} rowHeight={44} />
      </div>

      {/* Order history card — 7 cols, 10 rows */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Sk h={17} w="30%" /><Sk h={12} w={100} />
        </div>
        <SkTable rows={10} colWidths={['12%', '12%', '22%', '14%', '8%', '12%', '12%']} rowHeight={44} />
      </div>
    </>
  );
}
