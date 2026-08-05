/**
 * OrdersView.js — Orders Overview page
 *
 * This page shows:
 *   - Stat cards: total revenue, total orders (both scoped to the selected date range)
 *   - A bar/line chart of monthly revenue over time
 *   - A bar chart of revenue by city/state
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI — charts, stat cards, and layout.
 *
 * Useful libraries already installed:
 *   - recharts: BarChart, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { getOrders, getCities } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

export default function OrdersView() {
  const { startDate, endDate, setStartDate, setEndDate } = useTheme();
  const [orders,    setOrders]    = useState([]);
  const [cities,    setCities]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [o, c] = await Promise.all([
        getOrders(startDate, endDate),
        getCities(startDate, endDate),
      ]);
      setOrders(o);
      setCities(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
        </div>

        {/* ── Error state ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && <div className="loading">Loading orders data…</div>}

        {/* ── TODO: Build the UI here ────────────────────────────────────── */}
        {!loading && !error && (() => {
          const totalRevenue = orders.reduce((s, o) => s + (o.revenue || 0), 0);
          const totalOrders  = orders.reduce((s, o) => s + (o.order_count || 0), 0);
          return (
          <>
            <div className="stat-row">
              <div className="stat-box">
                <div className="label">Total Revenue</div>
                <div className="value">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-box">
                <div className="label">Total Orders</div>
                <div className="value">{totalOrders.toLocaleString()}</div>
              </div>
            </div>

            {/*
              STEP 2 — Monthly revenue chart
              orders is an array of: { month, month_name, order_count, revenue }
              Use a BarChart or LineChart from recharts.
              Hint: XAxis dataKey="month_name", Bar dataKey="revenue"
            */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Monthly Revenue</div>
              {orders.length === 0 ? (
                <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                  <div style={{ fontSize: 13 }}>The dates table is currently unavailable.</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={orders} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month_name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip formatter={v => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/*
              STEP 3 — Revenue by city chart
              cities is an array of: { city, state, order_count, revenue }
              Use a horizontal BarChart (layout="vertical").
              Show top 10 cities only.
              Hint: .slice(0, 10) on cities array
            */}
            
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Revenue by City</div>
              {cities.length === 0 ? (
                <div style={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                  <div style={{ fontSize: 13 }}>The customers table is currently unavailable.</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    layout="vertical"
                    data={cities.slice(0, 10)}
                    margin={{ top: 4, right: 24, left: 80, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} width={76} />
                    <Tooltip formatter={v => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--blue)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
          );
        })()}
      </div>
    </div>
  );
}
