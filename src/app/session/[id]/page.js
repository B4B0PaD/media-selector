"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import MediaViewer from '@/components/MediaViewer';

function getBasename(path) {
  return path?.split(/[/\\]/).pop() ?? path;
}

function ProgressHeader({ session, currentMatch }) {
  const total = session.initialQueue?.length || 1;
  const done = session.matches?.length || 0;
  const totalMatches = Math.max(total - 1, 1);
  const pct = Math.min(Math.round((done / totalMatches) * 100), 100);

  // Current round detection: count items still in play
  const inPlay = session.queue.length + session.nextRoundQueue.length + (currentMatch ? 2 : 0);
  const round = total > 0 ? Math.ceil(Math.log2(total)) - Math.ceil(Math.log2(Math.max(inPlay, 1))) + 1 : 1;

  return (
    <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.35s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{session.name}</h2>
          <span className="badge badge-accent">Round {round}</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{done}</span> / {totalMatches} match&nbsp;·&nbsp;
          <span style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>{pct}%</span>
        </div>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SessionPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSession = async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setCurrentMatch(data.currentMatch);
      setSelectedWinner(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSession(); }, [id]);

  const handleSelect = (winnerPath) => {
    if (isSubmitting) return;
    setSelectedWinner(prev => prev === winnerPath ? null : winnerPath);
  };

  const confirmVote = async () => {
    if (!selectedWinner || isSubmitting) return;
    setIsSubmitting(true);
    await fetch(`/api/sessions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner: selectedWinner })
    });
    setIsSubmitting(false);
    fetchSession();
  };

  const handleUndo = async () => {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'undo' })
    });
    if (res.ok) fetchSession();
    else {
      const data = await res.json();
      alert(data.error || "Impossibile annullare l'ultima azione.");
    }
  };

  if (loading && !session) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '15vh', color: 'var(--muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
      <p>Caricamento arena...</p>
    </div>
  );
  if (!session) return (
    <div className="container" style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '10vh' }}>
      Sessione non trovata.
    </div>
  );

  const canUndo = session.initialQueue && session.matches.length > 0;

  /* ── WINNER SCREEN ── */
  if (session.winner) {
    return (
      <div className="container">
        {/* Top nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="btn btn-outline" onClick={() => router.push('/')}>
            ← Dashboard
          </button>
          {canUndo && (
            <button className="btn btn-danger" onClick={handleUndo}>
              ↩ Annulla Ultimo Scarto
            </button>
          )}
        </div>

        {/* Winner announcement */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Torneo Concluso!</h1>
          <p style={{ color: 'var(--muted)' }}>Il vincitore assoluto di <strong style={{ color: 'var(--foreground)' }}>"{session.name}"</strong> è:</p>
        </div>

        <div className="card" style={{
          maxWidth: '760px', margin: '0 auto 4rem',
          borderColor: 'var(--success)',
          animation: 'successGlow 3s ease-in-out infinite',
        }}>
          <MediaViewer path={session.winner} type={session.type} />
          <div style={{
            marginTop: '1rem', textAlign: 'center',
            fontFamily: 'var(--font-geist-mono)', fontSize: '0.85rem',
            color: 'var(--muted)', wordBreak: 'break-all'
          }}>
            {getBasename(session.winner)}
          </div>
        </div>

        {/* Decision tree */}
        <div style={{ animation: 'fadeInUp 0.5s 0.2s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Albero Decisionale 🌲</h2>
            <span className="badge badge-accent">{session.matches.length} match</span>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Storico completo degli scontri, dal più recente al primo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...session.matches].reverse().map((match, i) => {
              const name1 = getBasename(match.item1);
              const name2 = getBasename(match.item2);
              const w1 = match.winner === match.item1;
              const w2 = match.winner === match.item2;
              return (
                <div key={match.id} className="card" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1.25rem',
                  opacity: i === 0 ? 1 : Math.max(0.5, 1 - i * 0.07),
                  animation: `fadeInUp 0.3s ${i * 0.04}s ease both`,
                }}>
                  <div style={{
                    textAlign: 'right',
                    fontWeight: w1 ? 700 : 400,
                    color: w1 ? 'var(--success)' : 'var(--muted)',
                    fontSize: '0.9rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {w1 && <span style={{ marginRight: '0.4rem' }}>✨</span>}{name1}
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: '0.75rem', color: 'var(--danger)',
                    padding: '0.2rem 0.6rem', borderRadius: '6px',
                    background: 'var(--danger-subtle)', border: '1px solid rgba(248,113,113,0.15)',
                    letterSpacing: '0.05em', flexShrink: 0
                  }}>VS</div>
                  <div style={{
                    textAlign: 'left',
                    fontWeight: w2 ? 700 : 400,
                    color: w2 ? 'var(--success)' : 'var(--muted)',
                    fontSize: '0.9rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {name2}{w2 && <span style={{ marginLeft: '0.4rem' }}>✨</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── ACTIVE MATCH SCREEN ── */
  const totalRemaining = session.queue.length + session.nextRoundQueue.length + (currentMatch ? 2 : 0);

  return (
    <div className="container" style={{ maxWidth: '1600px' }}>
      {/* Top nav bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={() => router.push('/')}>
          ← Pausa
        </button>
        {canUndo && (
          <button className="btn btn-danger" style={{ fontSize: '0.85rem' }} onClick={handleUndo}>
            ↩ Annulla Ultima Scelta
          </button>
        )}
      </div>

      {/* Progress header */}
      <ProgressHeader session={session} currentMatch={currentMatch} />

      {/* Match title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Scegli il Migliore</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
          Clicca il riquadro che preferisci, poi conferma. Rimanenti: <strong style={{ color: 'var(--foreground)' }}>{totalRemaining}</strong>
        </p>
      </div>

      {currentMatch && (
        <>
          {/* Arena */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1.5rem',
            alignItems: 'stretch',
          }}>
            {/* Item 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MediaViewer
                path={currentMatch.item1}
                type={session.type}
                isSelected={selectedWinner === currentMatch.item1}
                onClick={() => handleSelect(currentMatch.item1)}
              />
              <div style={{
                textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)',
                fontFamily: 'var(--font-geist-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                padding: '0 0.5rem'
              }}>
                {getBasename(currentMatch.item1)}
              </div>
            </div>

            {/* VS column */}
            <div className="vs-divider" style={{ minWidth: '3rem' }}>
              <span>VS</span>
              <div style={{ width: '2px', height: '40px', background: 'linear-gradient(to bottom, transparent, var(--danger), transparent)', borderRadius: '2px' }} />
            </div>

            {/* Item 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MediaViewer
                path={currentMatch.item2}
                type={session.type}
                isSelected={selectedWinner === currentMatch.item2}
                onClick={() => handleSelect(currentMatch.item2)}
              />
              <div style={{
                textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)',
                fontFamily: 'var(--font-geist-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                padding: '0 0.5rem'
              }}>
                {getBasename(currentMatch.item2)}
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <div style={{
            textAlign: 'center', marginTop: '2.5rem',
            minHeight: '64px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {selectedWinner ? (
              <button
                className="btn btn-primary"
                onClick={confirmVote}
                disabled={isSubmitting}
                style={{ fontSize: '1.05rem', padding: '0.9rem 3.5rem', animation: 'fadeInUp 0.3s ease' }}
              >
                {isSubmitting ? '⏳ Salvataggio...' : `✓ Conferma: "${getBasename(selectedWinner)}"`}
              </button>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Seleziona un'opzione per procedere
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
