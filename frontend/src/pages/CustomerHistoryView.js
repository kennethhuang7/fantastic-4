/**
 * CustomerHistoryView.js — Customer Detail page (View 4)
 *
 * Opened when a user clicks a customer row in CustomersView (View 3).
 * Shows:
 *   - Customer profile header (name, email, current city/state)
 *   - SCD Type 2 address history table
 *   - Full order history table
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCustomerHistory } from '../utils/api';

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

export default function CustomerHistoryView() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCustomerHistory(customerId);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [customerId]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        {/* ── Back button ──────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/customers')}
          style={{
            marginBottom: 20, background: 'none', border: 'none',
            color: 'var(--accent)', cursor: 'pointer', fontSize: 14,
            fontWeight: 600, padding: 0,
          }}
        >
          ← Back to Customers
        </button>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">Loading customer history…</div>}

        {!loading && !error && data && (
          <>
            {/* ── Profile header ───────────────────────────────────────── */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div className="section-title">{data.current.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{data.current.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {data.current.addr_city}, {data.current.addr_state}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Current address</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                <div className="stat-box" style={{ minWidth: 120 }}>
                  <div className="label">Total Orders</div>
                  <div className="value">{data.orders.length}</div>
                </div>
                <div className="stat-box" style={{ minWidth: 120 }}>
                  <div className="label">Total Spent</div>
                  <div className="value">{formatCurrency(data.orders.reduce((s, o) => s + (o.amount || 0), 0))}</div>
                </div>
                <div className="stat-box" style={{ minWidth: 120 }}>
                  <div className="label">Addresses</div>
                  <div className="value">{data.address_history.length}</div>
                </div>
              </div>
            </div>

            {/* ── SCD Type 2 address history ───────────────────────────── */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Address History (SCD Type 2)</div>
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

            {/* ── Order history ─────────────────────────────────────────── */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Order History</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Order ID', 'Date', 'Product', 'Category', 'Qty', 'Amount', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Qty' || h === 'Amount' ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o, i) => {
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
