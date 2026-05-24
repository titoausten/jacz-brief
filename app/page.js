'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: '120px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% auto',
            animation: `shimmer 1.5s linear infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyState({ onRefresh, loading }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>
        No brief yet for today
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
        Generate your first brief to get started
      </p>
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          padding: '10px 24px',
          borderRadius: '40px',
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating…' : 'Generate Brief'}
      </button>
    </div>
  );
}

function BriefCard({ item, index, accent, accentDim }) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${index * 0.07}s`,
        opacity: 0, // starts hidden, filled by animation
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        transition: 'background 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
    >
      {/* Number + Source row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: accent,
          letterSpacing: '0.08em',
          opacity: 0.8,
        }}>
          {num}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          background: accentDim,
          padding: '2px 8px',
          borderRadius: '20px',
          letterSpacing: '0.04em',
        }}>
          {item.source}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '18px',
        fontWeight: 500,
        lineHeight: 1.35,
        color: 'var(--text-primary)',
        marginBottom: '10px',
      }}>
        {item.title}
      </h3>

      {/* Summary */}
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '13.5px',
        lineHeight: 1.65,
        color: 'var(--text-secondary)',
        fontWeight: 300,
        marginBottom: '10px',
      }}>
        {item.summary}
      </p>

      {/* Why it matters */}
      {item.why && (
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '13px',
          fontStyle: 'italic',
          lineHeight: 1.55,
          color: accent,
          opacity: 0.8,
          marginBottom: '14px',
          paddingLeft: '10px',
          borderLeft: `1px solid ${accent}`,
        }}>
          {item.why}
        </p>
      )}

      {/* Read link */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: accent,
            opacity: 0.75,
            transition: 'opacity 0.15s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
        >
          READ FULL ARTICLE →
        </a>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('ai-safety');
  const [briefs, setBriefs] = useState({ 'ai-safety': null, music: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const accent = activeTab === 'ai-safety' ? 'var(--ai-accent)' : 'var(--music-accent)';
  const accentDim = activeTab === 'ai-safety' ? 'var(--ai-accent-dim)' : 'var(--music-accent-dim)';
  const accentGlow = activeTab === 'ai-safety' ? 'var(--ai-accent-glow)' : 'var(--music-accent-glow)';

  const fetchBrief = useCallback(async (category) => {
    try {
      const res = await fetch(`/api/briefs?category=${category}`);
      const data = await res.json();
      setBriefs((prev) => ({ ...prev, [category]: data }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Load both briefs on mount
  useEffect(() => {
    Promise.all([fetchBrief('ai-safety'), fetchBrief('music')]).finally(() =>
      setLoading(false)
    );
  }, [fetchBrief]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      await fetchBrief(activeTab);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const currentBrief = briefs[activeTab];
  const items = currentBrief?.items || [];
  const updatedAt = currentBrief?.updatedAt;
  const isEmpty = !loading && (!currentBrief || currentBrief.empty || items.length === 0);

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 'var(--max-width)',
        padding: '0 16px 80px',
      }}>

        {/* ── Header ── */}
        <header style={{ padding: '48px 0 32px' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            {formatDate(new Date().toISOString())}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 10vw, 52px)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            color: 'var(--text-primary)',
          }}>
            The Brief
          </h1>
          <div style={{
            width: '32px',
            height: '1px',
            background: accent,
            marginTop: '16px',
            transition: 'background 0.3s',
          }} />
        </header>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
        }}>
          {[
            { key: 'ai-safety', label: 'AI Safety', sub: 'Morning', color: 'var(--ai-accent)', glow: 'var(--ai-accent-glow)' },
            { key: 'music', label: 'Music Biz', sub: 'Evening', color: 'var(--music-accent)', glow: 'var(--music-accent-glow)' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${isActive ? tab.color : 'var(--border)'}`,
                  boxShadow: isActive ? `0 0 20px ${tab.glow}` : 'none',
                  color: isActive ? tab.color : 'var(--text-muted)',
                  textAlign: 'left',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                  opacity: 0.7,
                }}>
                  {tab.sub}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}>
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Meta bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          height: '28px',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {updatedAt ? `Updated ${timeAgo(updatedAt)}` : loading ? '' : 'Not generated yet'}
          </span>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: refreshing ? 'var(--text-muted)' : accent,
              opacity: (refreshing || loading) ? 0.5 : 1,
              cursor: (refreshing || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.3s',
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            }}>
              ↻
            </span>
            {refreshing ? 'REFRESHING…' : 'REFRESH'}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <Skeleton />
        ) : isEmpty ? (
          <EmptyState onRefresh={handleRefresh} loading={refreshing} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, i) => (
              <BriefCard
                key={i}
                item={item}
                index={i}
                accent={accent}
                accentDim={accentDim}
              />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        {!loading && !isEmpty && updatedAt && (
          <p style={{
            marginTop: '40px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            letterSpacing: '0.06em',
          }}>
            GENERATED {formatTime(updatedAt)} · {formatDate(updatedAt).toUpperCase()}
          </p>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeUp 0.4s ease forwards;
        }
      `}</style>
    </main>
  );
}
