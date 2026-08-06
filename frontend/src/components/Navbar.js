import React, { useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import ServiceStatus from './ServiceStatus';

const LINKS = [
  { label: 'Home',      path: '/'          },
  { label: 'Orders',    path: '/orders'    },
  { label: 'Products',  path: '/products'  },
  { label: 'Customers', path: '/customers' },
];

// Module-level: persists across Navbar remounts so the pill always slides
// from the previous tab position rather than from 0.
let _pillCache = { left: 0, width: 0, ready: false };

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { dark, toggle } = useTheme();

  const btnRefs = useRef([]);
  // Initialise from the cache so the pill starts at the right spot even on remount
  const [pill, setPill] = useState(_pillCache);

  useLayoutEffect(() => {
    const idx = LINKS.findIndex(l =>
      l.path === '/' ? location.pathname === '/' : location.pathname.startsWith(l.path)
    );
    const el = btnRefs.current[idx];
    if (!el) return;
    const parent = el.parentElement.getBoundingClientRect();
    const rect   = el.getBoundingClientRect();
    const next = { left: rect.left - parent.left, width: rect.width, ready: true };
    _pillCache = next;   // persist for the next remount
    setPill(next);
  }, [location.pathname]);

  return (
    <nav style={{
      padding: '0 24px', height: 56,
      background: dark ? '#0a1520' : '#0D2B4E',
      borderBottom: `1px solid ${dark ? 'rgba(77,182,172,0.15)' : 'rgba(77,182,172,0.2)'}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      position: 'sticky', top: 0, zIndex: 100,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
    }}>

      {/* ── Logo (left) ───────────────────────────────────────────────────── */}
      <div
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #4DB6AC 0%, #1565C0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Shopping cart SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9"  cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>NovaCart</span>
      </div>

      {/* ── Nav links (centre column — always perfectly centred) ─────────── */}
      <div style={{ position: 'relative', display: 'flex', gap: 2, justifyContent: 'center' }}>

        {/* Sliding background pill — always rendered, opacity:0 until first measurement */}
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: pill.left, width: pill.width, height: 30,
          background: 'rgba(77,182,172,0.15)',
          border: '1px solid rgba(77,182,172,0.35)',
          borderRadius: 6,
          opacity: pill.ready ? 1 : 0,
          transition: 'left 0.22s cubic-bezier(.4,0,.2,1), width 0.22s cubic-bezier(.4,0,.2,1), opacity 0.15s',
          pointerEvents: 'none',
        }} />

        {LINKS.map(({ label, path }, i) => {
          const active = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <button
              key={path}
              ref={el => btnRefs.current[i] = el}
              onClick={() => navigate(path)}
              style={{
                position: 'relative', zIndex: 1,
                background: 'transparent',
                border: 'none',
                color: active ? '#4DB6AC' : 'rgba(255,255,255,0.5)',
                borderRadius: 6,
                padding: '5px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Right: service status + theme toggle ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }}>
        <ServiceStatus />

        {/* Vertical separator */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />

        {/* Animated labelled pill toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: dark ? 'rgba(77,182,172,0.18)' : 'rgba(255,255,255,0.12)',
            border: dark ? '1px solid rgba(77,182,172,0.35)' : '1px solid rgba(255,255,255,0.18)',
            borderRadius: 20,
            padding: '4px 12px 4px 8px',
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {/* Animated icon swap */}
          <div style={{
            width: 18, height: 18,
            transition: 'transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.2s',
            transform: dark ? 'rotate(0deg)' : 'rotate(90deg)',
            color: dark ? '#4DB6AC' : 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {dark ? (
              /* Moon */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              /* Sun */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1"  x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1"  y1="12" x2="3"  y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
                <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
              </svg>
            )}
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: dark ? '#4DB6AC' : 'rgba(255,255,255,0.8)',
            transition: 'color 0.2s',
            width: 34, display: 'inline-block', textAlign: 'center',
          }}>
            {dark ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </nav>
  );
}
