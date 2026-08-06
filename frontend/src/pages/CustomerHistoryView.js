/**
 * CustomerHistoryView.js — Customer Detail modal (View 4)
 *
 * Rendered as an overlay on top of CustomersView when a customer row is clicked.
 * Props:
 *   customerId — the customer to load
 *   onClose    — called when the user clicks × or the backdrop
 */

import React, { useState, useEffect } from 'react';
import { getCustomerHistory } from '../utils/api';
import { CustomerHistorySkeleton } from '../components/Skeleton';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_COLORS = {
  delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  shipped:   { bg: '#E3F2FD', color: '#1565C0' },
  pending:   { bg: '#FFF8E1', color: '#F57F17' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

export default function CustomerHistoryView({ customerId, onClose }) {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [visibleOrders, setVisibleOrders] = useState(10);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      setVisibleOrders(10);
      try {
        const result = await getCustomerHistory(customerId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [customerId]);

  return (
    // ── Backdrop ─────────────────────────────────────────────────────────────
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        overflowY: 'auto', padding: '40px 16px',
      }}
    >
      {/* ── Panel — stop clicks propagating to backdrop ─────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 860,
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          padding: 24,
        }}
      >
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="section-title">
            {data ? data.current.name : 'Customer Detail'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, width: 32, height: 32,
              cursor: 'pointer', fontSize: 18, lineHeight: 1,
              color: 'var(--text-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <CustomerHistorySkeleton />}

        {!loading && !error && data && (
          <>
            {/* ── Profile stats ──────────────────────────────────────────── */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{data.current.email}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {data.current.addr_city}, {data.current.addr_state}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Current address</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="stat-box" style={{ minWidth: 110 }}>
                  <div className="label">Total Orders</div>
                  <div className="value">{data.total_orders}</div>
                </div>
                <div className="stat-box" style={{ minWidth: 110 }}>
                  <div className="label">Total Spent</div>
                  <div className="value">{formatCurrency(data.total_spent)}</div>
                </div>
                <div className="stat-box" style={{ minWidth: 110 }}>
                  <div className="label">Addresses</div>
                  <div className="value">{data.address_history.length}</div>
                </div>
              </div>
            </div>

            {/* ── SCD Type 2 address history ─────────────────────────────── */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>Address History (SCD Type 2)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['City', 'State', 'Valid From', 'Valid To', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.address_history.map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{a.addr_city}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{a.addr_state}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{a.valid_from}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{a.valid_to ?? '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {a.is_current
                          ? <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Current</span>
                          : <span style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>Previous</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Order history ──────────────────────────────────────────── */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div className="section-title">Order History</div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Showing {Math.min(visibleOrders, data.orders.length)} of {data.orders.length}
                </span>
              </div>
              {data.orders.length === 0 ? (
                <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3l-4 4-4-4"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>No order history</div>
                  <div style={{ fontSize: 13 }}>No orders found for this customer.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Order ID', 'Date', 'Product', 'Category', 'Qty', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Qty' || h === 'Amount' ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.slice(0, visibleOrders).map((o, i) => {
                      const sc = STATUS_COLORS[o.status] || { bg: 'var(--bg-primary)', color: 'var(--text-muted)' };
                      return (
                        <tr key={o.order_id} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{o.order_id}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{o.order_date}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{o.product_name}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{o.category}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{o.quantity}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(o.amount)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {data.orders.length > 0 && visibleOrders < data.orders.length && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button className="btn-apply" onClick={() => setVisibleOrders(v => v + 10)}>
                    Show 10 more
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
