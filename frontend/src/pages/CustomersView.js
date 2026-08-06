/**
 * CustomersView.js — Customer List page
 *
 * This page shows:
 *   - A sortable table of top 20 customers by revenue
 *   - Columns: Name | City | State | Orders | Total Spent
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI and the sorting logic.
 */

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { CustomersSkeleton } from '../components/Skeleton';
import { getCustomers } from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import CustomerHistoryView from './CustomerHistoryView';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 20;

export default function CustomersView() {
  const { startDate, endDate, setStartDate, setEndDate } = useTheme();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customers,   setCustomers]   = useState([]);
  const [sortBy,      setSortBy]      = useState('total_spent');
  const [sortDir,     setSortDir]     = useState('desc');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [limit,       setLimit]       = useState(20);
  const [limitInput,  setLimitInput]  = useState('20');
  const [maxCustomers, setMaxCustomers] = useState(null);
  const [page,        setPage]        = useState(1);

  useEffect(() => { loadData(); }, []);

  async function loadData(nextLimit = limit, refetchMax = false) {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const [data, all] = await Promise.all([
        getCustomers(startDate, endDate, nextLimit),
        (maxCustomers === null || refetchMax) ? getCustomers(startDate, endDate, 9999) : Promise.resolve(null),
      ]);
      setCustomers(data);
      if (all !== null) setMaxCustomers(all.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    loadData(limit, true);
  }

  function handleLimitInputChange(e) {
    // Allow free typing; only clamp on blur or Enter
    setLimitInput(e.target.value);
  }

  function commitLimitInput() {
    const max = maxCustomers ?? 9999;
    const parsed = parseInt(limitInput, 10);
    const clamped = isNaN(parsed) ? 20 : Math.min(Math.max(1, parsed), max);
    setLimitInput(String(clamped));
    setLimit(clamped);
    loadData(clamped);
  }

  function handleLimitKeyDown(e) {
    if (e.key === 'Enter') commitLimitInput();
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

  // Apply sort to customers array
  // sort by last name
  const sorted = [...customers].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    if (sortBy === 'name') {
      const aParts = a.name.trim().split(' ');
      const bParts = b.name.trim().split(' ');
      const aLast = aParts[aParts.length - 1], aFirst = aParts[0];
      const bLast = bParts[bParts.length - 1], bFirst = bParts[0];
      const cmp = aLast.localeCompare(bLast) || aFirst.localeCompare(bFirst);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  // Sort indicator helper
  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  // Pagination — only active when limit > PAGE_SIZE
  const paginated = limit > PAGE_SIZE;
  const totalPages = paginated ? Math.ceil(sorted.length / PAGE_SIZE) : 1;
  const pageRows   = paginated ? sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : sorted;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={handleApply}>Apply</button>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {paginated ? `${pageRows.length}/${customers.length}` : `${customers.length}/${customers.length}`} customers
          </span>
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <CustomersSkeleton />}

        {!loading && !error && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="section-title">
                Top {customers.length} Customers by Revenue
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {paginated && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Page {page} of {totalPages}
                  </span>
                )}
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Show</label>
                <input
                  type="number"
                  min={1}
                  max={maxCustomers ?? undefined}
                  value={limitInput}
                  onChange={handleLimitInputChange}
                  onBlur={commitLimitInput}
                  onKeyDown={handleLimitKeyDown}
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
                {maxCustomers !== null && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of {maxCustomers}</span>
                )}
              </div>
            </div>

            {/*
              STEP 1 — Sortable table
              sorted is: [{ customer_id, name, city, state, total_orders, total_spent }]

              Build a table with these columns:
                Name | City | State | Orders | Total Spent

              Each column header should be clickable and call handleSort(columnName).
              Use sortIcon(columnName) to show ↑ or ↓ on the active sort column.

              Hint: use a standard HTML <table> with <thead> and <tbody>.
              Style alternating rows with different background colors.
              Format total_spent with formatCurrency().
            */}

            {customers.length === 0 ? (
              <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <div style={{ fontSize: 15, fontWeight: 500 }}>No data available</div>
                <div style={{ fontSize: 13 }}>The customers table is currently unavailable.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {[
                      { key: 'name',         label: 'Name'        },
                      { key: 'city',         label: 'City'        },
                      { key: 'state',        label: 'State'       },
                      { key: 'total_orders', label: 'Orders'      },
                      { key: 'total_spent',  label: 'Total Spent' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        style={{
                          padding: '8px 12px',
                          textAlign: key === 'total_orders' || key === 'total_spent' ? 'right' : 'left',
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
                  {pageRows.map((c, i) => (
                    <tr
                      key={c.customer_id}
                      onClick={() => setSelectedCustomerId(c.customer_id)}
                      style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{c.city}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{c.state}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{c.total_orders}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(c.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {paginated && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 16 }}>
                <button
                  className="btn-apply"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  style={{ opacity: page === 1 ? 0.4 : 1 }}
                >
                  ← Prev
                </button>
                {(() => {
                  // Build the visible page items: numbers + '…' sentinels
                  const items = [];
                  for (let n = 1; n <= totalPages; n++) {
                    if (n === 1 || n === totalPages || (n >= page - 1 && n <= page + 1)) {
                      items.push(n);
                    } else if (items[items.length - 1] !== '…') {
                      items.push('…');
                    }
                  }
                  return items.map((item, i) =>
                    item === '…' ? (
                      <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 13 }}>…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
                          background: item === page ? 'var(--accent)' : 'var(--bg-primary)',
                          color: item === page ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: item === page ? 700 : 400, fontSize: 13,
                        }}
                      >
                        {item}
                      </button>
                    )
                  );
                })()}
                <button
                  className="btn-apply"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  style={{ opacity: page === totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCustomerId && (
        <CustomerHistoryView
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
