import React, { useEffect, useState } from 'react';
import { getHealth } from '../utils/api';

export default function ServiceStatus() {
  const [status,  setStatus]  = useState('checking');
  const [detail,  setDetail]  = useState('');
  const [hovered, setHovered] = useState(false);

  async function check() {
    try {
      const data = await getHealth();
      setStatus(data.status === 'healthy' ? 'healthy' : 'degraded');
      setDetail(data.database?.status === 'connected' ? 'Connected' : 'DB issue');
    } catch {
      setStatus('error');
      setDetail('Backend unreachable');
    }
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const colors = { healthy: '#00897B', degraded: '#F9A825', error: '#C62828', checking: '#90A4AE' };
  const sublabels = { healthy: 'Healthy', degraded: 'Degraded', error: 'Offline', checking: 'Checking…' };
  const tooltips = {
    healthy:  'Everything is running normally. The dashboard is connected to the database and all data is loading as expected.',
    degraded: "The dashboard is running but something isn't quite right — data may be incomplete or some features may not work as expected.",
    error:    'The dashboard cannot reach the backend server. Data may be out of date or unavailable. Try refreshing the page.',
    checking: 'Checking whether the dashboard server and database are reachable…',
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'default' }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          backgroundColor: colors[status],
          boxShadow: status === 'healthy' ? `0 0 5px ${colors[status]}` : 'none',
          display: 'inline-block',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
          Service Health:&nbsp;
          <span style={{ color: colors[status], fontWeight: 600 }}>{sublabels[status]}</span>
        </span>
      </div>

      {/* Custom tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 260,
          background: '#1a2b3c',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '10px 13px',
          fontSize: 12,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.82)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 200,
          // small arrow
        }}>
          {tooltips[status]}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: -5, right: 16,
            width: 9, height: 9,
            background: '#1a2b3c',
            border: '1px solid rgba(255,255,255,0.12)',
            borderBottom: 'none', borderRight: 'none',
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}
    </div>
  );
}
