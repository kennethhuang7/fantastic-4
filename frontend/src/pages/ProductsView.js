/**
 * ProductsView.js — Product Performance page
 *
 * This page shows:
 *   - A bar chart of top 10 products by revenue
 *   - A table with product name, category, units sold, and revenue
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { ProductsSkeleton } from '../components/Skeleton';
import { getProducts } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

// Format currency helper
function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

const CHART_PAGE_SIZE = 10;

export default function ProductsView() {
  const { startDate, endDate, setStartDate, setEndDate } = useTheme();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [sortBy,    setSortBy]    = useState('revenue');
  const [sortDir,   setSortDir]   = useState('desc');
  const [chartLimit,     setChartLimit]     = useState(10);
  const [chartLimitInput, setChartLimitInput] = useState('10');
  const [maxProducts, setMaxProducts] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(startDate, endDate);
      setProducts(data);
      setMaxProducts(data.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChartLimitInputChange(e) {
    setChartLimitInput(e.target.value);
  }

  function commitChartLimitInput() {
    const max = maxProducts ?? 9999;
    const parsed = parseInt(chartLimitInput, 10);
    const clamped = isNaN(parsed) ? 10 : Math.min(Math.max(1, parsed), max);
    setChartLimitInput(String(clamped));
    setChartLimit(clamped);
  }

  function handleChartLimitKeyDown(e) {
    if (e.key === 'Enter') commitChartLimitInput();
  }

  // Sort handler — toggles direction if same column, resets to desc if new column
  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  // Apply sort to products array
  const sorted = [...products].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  // Sort indicator helper
  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <ProductsSkeleton />}

        {!loading && !error && (
          <div className="grid-2">

            {/*
              STEP 1 — Top products bar chart
              products is: [{ product_id, name, category, units_sold, revenue }]
              Use a horizontal BarChart (layout="vertical").
              XAxis type="number", YAxis type="category" dataKey="name"
              Hint: truncate long product names to 20 chars
            */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="section-title">Top {chartLimit} Products by Revenue</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Show</label>
                  <input
                    type="number"
                    min={1}
                    max={maxProducts ?? undefined}
                    value={chartLimitInput}
                    onChange={handleChartLimitInputChange}
                    onBlur={commitChartLimitInput}
                    onKeyDown={handleChartLimitKeyDown}
                    style={{
                      width: 70,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                  {maxProducts !== null && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of {maxProducts}</span>
                  )}
                </div>
              </div>
              {products.length === 0 ? (
                <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3l-4 4-4-4"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                  <div style={{ fontSize: 13 }}>The products table is currently unavailable.</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(300, chartLimit * 30)}>
                  <BarChart
                    layout="vertical"
                    data={products.slice(0, chartLimit).map(p => ({ ...p, name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name }))}
                    margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                  >
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#3b82d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/*
              STEP 2 — Products table
              Show all products in a table: Name | Category | Units Sold | Revenue
              Hint: use an HTML table or build with divs.
              Format revenue with the formatCurrency helper above.
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Product Details</div>
              {products.length === 0 ? (
                <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                  <div style={{ fontSize: 13 }}>The products table is currently unavailable.</div>
                </div>
              ) : (
                <div style={{ overflowY: 'auto', maxHeight: Math.max(300, chartLimit * 30) }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {[
                          { key: 'name',        label: 'Name'       },
                          { key: 'category',    label: 'Category'   },
                          { key: 'units_sold',  label: 'Units Sold' },
                          { key: 'revenue',     label: 'Revenue'    },
                        ].map(({ key, label }) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            style={{
                              padding: '8px 12px',
                              textAlign: key === 'units_sold' || key === 'revenue' ? 'right' : 'left',
                              cursor: 'pointer',
                              userSelect: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              color: sortBy === key ? 'var(--accent)' : 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {label}{sortIcon(key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((p, i) => (
                        <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-card)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{p.category}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{p.units_sold.toLocaleString()}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
