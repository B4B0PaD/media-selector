"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import MediaViewer from '@/components/MediaViewer';

export default function SessionPage({ params }) {
  // Fix for Next 15: unwrap params
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Selection vs submitting state
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSession = async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setCurrentMatch(data.currentMatch);
      setSelectedWinner(null); // Reset selection when match changes
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  const handleSelect = (winnerPath) => {
    if (isSubmitting) return;
    setSelectedWinner(winnerPath);
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
    
    if (res.ok) {
      fetchSession();
    } else {
      const data = await res.json();
      alert(data.error || "Impossibile annullare l'ultima azione.");
    }
  };

  if (loading && !session) return <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>Caricamento arena...</div>;
  if (!session) return <div className="container" style={{ color: 'var(--danger)' }}>Sessione non trovata.</div>;

  const totalRemaining = session.queue.length + session.nextRoundQueue.length + (currentMatch ? 2 : 0);
  const canUndo = session.initialQueue && session.matches.length > 0;

  // If winner, display finale
  if (session.winner) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <button className="btn btn-outline" onClick={() => router.push('/')}>
            ← Torna alla Dashboard
          </button>
          {canUndo && (
            <button className="btn btn-outline" style={{ borderColor: '#4a2525', color: 'var(--danger)' }} onClick={handleUndo}>
              ↩️ Annulla Ultimo Scarto
            </button>
          )}
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--success)' }}>Torneo Concluso! 🏆</h1>
          <p style={{ color: '#a1a9b3' }}>Il vincitore assoluto di "{session.name}" è:</p>
        </div>

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', borderColor: 'var(--success)', boxShadow: '0 0 40px rgba(78, 207, 116, 0.2)' }}>
          <MediaViewer path={session.winner} type={session.type} />
          <p style={{ marginTop: '1rem', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'monospace', color: '#a1a9b3' }}>
            {session.winner}
          </p>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <h2>Albero Decisionale 🌲</h2>
          <p style={{ color: '#a1a9b3', marginBottom: '2rem' }}>Ripercorri l'intero storico degli scontri, dal più recente al primo.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...session.matches].reverse().map((match, i) => (
              <div key={match.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: i === 0 ? 1 : 0.8 }}>
                <div style={{ flex: 1, textAlign: 'right', fontWeight: match.winner === match.item1 ? 'bold' : 'normal', color: match.winner === match.item1 ? 'var(--success)' : 'inherit' }}>
                  {match.item1.split(/[/\\]/).pop()}
                  {match.winner === match.item1 && ' ✨'}
                </div>
                <div style={{ color: 'var(--danger)', fontWeight: 'bold', padding: '0 1rem' }}>VS</div>
                <div style={{ flex: 1, textAlign: 'left', fontWeight: match.winner === match.item2 ? 'bold' : 'normal', color: match.winner === match.item2 ? 'var(--success)' : 'inherit' }}>
                  {match.winner === match.item2 && '✨ '}
                  {match.item2.split(/[/\\]/).pop()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active match
  return (
    <div className="container" style={{ maxWidth: '1600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={() => router.push('/')}>
          ← Pausa e torna alla Dashboard
        </button>
        {canUndo && (
           <button className="btn btn-outline" style={{ borderColor: '#4a2525', color: 'var(--danger)' }} onClick={handleUndo}>
             ↩️ Annulla Scelta Precedente
           </button>
        )}
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0 }}>{session.name}</h2>
          <div style={{ color: '#a1a9b3' }}>Elementi rimanenti: {totalRemaining}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Scegli il Migliore</h1>
        <p style={{ color: '#a1a9b3' }}>Clicca sul riquadro che preferisci per selezionarlo, poi conferma.</p>
      </div>

      {currentMatch && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <div>
              <MediaViewer 
                path={currentMatch.item1} 
                type={session.type} 
                isSelected={selectedWinner === currentMatch.item1} 
                onClick={() => handleSelect(currentMatch.item1)} 
              />
              <div style={{ marginTop: '1rem', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'monospace', color: '#a1a9b3' }}>
                {currentMatch.item1.split(/[/\\]/).pop()}
              </div>
            </div>

            <div>
               <MediaViewer 
                path={currentMatch.item2} 
                type={session.type} 
                isSelected={selectedWinner === currentMatch.item2} 
                onClick={() => handleSelect(currentMatch.item2)} 
              />
              <div style={{ marginTop: '1rem', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'monospace', color: '#a1a9b3' }}>
                 {currentMatch.item2.split(/[/\\]/).pop()}
              </div>
            </div>
          </div>
          
          {selectedWinner && (
            <div style={{ textAlign: 'center', marginTop: '3rem', animation: 'fadeIn 0.3s ease-out' }}>
               <button 
                 className="btn btn-primary" 
                 onClick={confirmVote} 
                 disabled={isSubmitting}
                 style={{ fontSize: '1.2rem', padding: '1rem 3rem', boxShadow: '0 10px 30px rgba(94,106,210, 0.4)' }}
               >
                 {isSubmitting ? 'Salvataggio...' : '✓ Conferma Selezione e Vai Avanti'}
               </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
