/**
 * HomeView.js — Dashboard Homepage
 *
 * This page shows a high-level overview of the NovaCart franchise.
 * All data is fetched in a single request from GET /franchise/home.
 *
 * Sections:
 *   - KPI cards:               total revenue, total orders, unique customers,
 *                               last month revenue with MoM % change
 *   - Monthly Revenue Trend:   line chart across the full data range
 *   - Order Status Breakdown:  pie chart of all order statuses
 *   - Top Categories:          horizontal bar chart — top 5 categories by revenue
 *   - Monthly Order Volume:    bar chart of order count per month
 *   - Recent Orders:           table of the 5 most recent orders
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import { HomeSkeleton } from '../components/Skeleton';
import { getHome } from '../utils/api';

function fmt(value) {
  if (value == null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Number(value).toFixed(2)}`;
}

function fmtFull(value) {
  if (value == null) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS = {
  delivered: '#00897B',
  shipped:   '#1565C0',
  pending:   '#F57F17',
  cancelled: '#C62828',
};

const CATEGORY_COLORS = ['#00897B', '#1565C0', '#7c5cd8', '#F57F17', '#455A64'];

const STATUS_BADGE = {
  delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  shipped:   { bg: '#E3F2FD', color: '#1565C0' },
  pending:   { bg: '#FFF8E1', color: '#F57F17' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

export default function HomeView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setData(await getHome());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <HomeSkeleton />}

        {!loading && !error && data && (() => {
          const { summary, monthly_revenue, status_breakdown, top_categories, recent_orders } = data;

          // Derive last month's revenue from monthly array for MoM comparison
          const lastMonth    = monthly_revenue[monthly_revenue.length - 1];
          const prevMonth    = monthly_revenue[monthly_revenue.length - 2];
          const momDelta     = lastMonth && prevMonth ? lastMonth.revenue - prevMonth.revenue : null;
          const momPct       = momDelta != null && prevMonth.revenue ? (momDelta / prevMonth.revenue) * 100 : null;

          return (
            <>
              {/* ── Date range banner ────────────────────────────────────── */}
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Data range: <strong>{summary.date_range.start}</strong> → <strong>{summary.date_range.end}</strong>
              </div>

              {/* ── KPI stat cards ───────────────────────────────────────── */}
              <div className="stat-row">
                <div className="stat-box">
                  <div className="label">Total Revenue</div>
                  <div className="value">{fmt(summary.total_revenue)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{fmtFull(summary.total_revenue)}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Total Orders</div>
                  <div className="value">{summary.total_orders.toLocaleString()}</div>
                </div>
                <div className="stat-box">
                  <div className="label">Unique Customers</div>
                  <div className="value">{summary.unique_customers.toLocaleString()}</div>
                </div>
                {lastMonth && (
                  <div className="stat-box">
                    <div className="label">Revenue — {lastMonth.month_name}</div>
                    <div className="value">{fmt(lastMonth.revenue)}</div>
                    {momPct != null && (
                      <div style={{ fontSize: 12, marginTop: 4, color: momPct >= 0 ? '#2E7D32' : '#C62828', fontWeight: 600 }}>
                        {momPct >= 0 ? '▲' : '▼'} {Math.abs(momPct).toFixed(1)}% vs prev month
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Revenue trend + Status breakdown ─────────────────────── */}
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                    <div className="section-title">Monthly Revenue Trend</div>
                    {monthly_revenue[0] && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{monthly_revenue[0].year}</span>}
                  </div>
                  {monthly_revenue.length === 0 ? (
                    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                      <div style={{ fontSize: 13 }}>The dates table is currently unavailable.</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={monthly_revenue} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month_name" tickFormatter={m => m.slice(0, 3)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <Tooltip labelFormatter={(_,p) => p[0]?.payload?.month ?? ''} formatter={v => [fmtFull(v), 'Revenue']} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card">
                  <div className="section-title" style={{ marginBottom: 16 }}>Order Status Breakdown</div>
                  {status_breakdown.length === 0 ? (
                    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                      <div style={{ fontSize: 13 }}>No order status data found.</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={status_breakdown}
                          dataKey="order_count"
                          nameKey="status"
                          cx="50%" cy="50%"
                          outerRadius={80}
                          label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {status_breakdown.map((entry, i) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v.toLocaleString(), name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Top categories + Monthly order volume ─────────────────── */}
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 16 }}>Top Categories by Revenue</div>
                  {top_categories.length === 0 ? (
                    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3l-4 4-4-4"/></svg>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                      <div style={{ fontSize: 13 }}>The products table is currently unavailable.</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart layout="vertical" data={top_categories} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                        <Tooltip formatter={v => [fmtFull(v), 'Revenue']} />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {top_categories.map((_, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                    <div className="section-title">Monthly Order Volume</div>
                    {monthly_revenue[0] && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{monthly_revenue[0].year}</span>}
                  </div>
                  {monthly_revenue.length === 0 ? (
                    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                      <div style={{ fontSize: 13 }}>The dates table is currently unavailable.</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthly_revenue} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month_name" tickFormatter={m => m.slice(0, 3)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <Tooltip labelFormatter={(_,p) => p[0]?.payload?.month ?? ''} formatter={v => [v.toLocaleString(), 'Orders']} />
                        <Bar dataKey="order_count" fill="var(--blue)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Recent orders table ───────────────────────────────────── */}
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>Recent Orders</div>
                {recent_orders.length === 0 ? (
                  <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3l-4 4-4-4"/></svg>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                    <div style={{ fontSize: 13 }}>No recent orders found.</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recent_orders.map((o, i) => {
                        const sc = STATUS_BADGE[o.status] || { bg: 'var(--bg-primary)', color: 'var(--text-muted)' };
                        return (
                          <tr key={o.order_id} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{o.order_id}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{o.order_date}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{o.customer_name}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{o.product_name}</td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{fmtFull(o.amount)}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
