"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LocalFilePicker from '@/components/LocalFilePicker';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';

const TYPE_ICONS = { video: '🎬', image: '🖼️', text: '📝' };
const TYPE_LABELS = { video: 'Video', image: 'Immagini', text: 'Testo' };

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function SessionCard({ s, onResume, onDelete }) {
  const totalItems = s.initialQueue?.length || (s.queue.length + s.nextRoundQueue.length);
  const matchesDone = s.matches?.length || 0;
  const isWinner = !!s.winner;

  // How many matches will a full tournament of N items take? N-1 total.
  const totalMatches = Math.max(totalItems - 1, 1);
  const pct = Math.min(Math.round((matchesDone / totalMatches) * 100), 100);

  return (
    <div className="card session-card animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`badge badge-accent`}>
              {TYPE_ICONS[s.type]} {TYPE_LABELS[s.type]}
            </span>
            <span className={`badge ${isWinner ? 'badge-success' : 'badge-warning'}`}>
              {isWinner ? '🏆 Completato' : `${totalItems} file`}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {formatDate(s.createdAt)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={() => onResume(s.id)}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {isWinner ? '📊 Risultati' : '▶ Riprendi'}
          </button>
          <button
            onClick={() => onDelete(s.id, s.name)}
            className="btn btn-danger"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            title="Elimina sessione"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!isWinner && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
            <span>{matchesDone} match completati</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {isWinner && (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'var(--font-geist-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🏆 {s.winner?.split(/[/\\]/).pop()}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [type, setType] = useState('video');
  const [sourceFiles, setSourceFiles] = useState([]);

  const [showLocalPicker, setShowLocalPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => { setSessions(data); setLoading(false); });
  }, []);

  const handleFilesSelected = (files) => {
    if (files.length === 0) return;
    setSourceFiles(prev => {
      const existingPaths = new Set(prev.map(f => f.path));
      const newFiles = files.filter(f => !existingPaths.has(f.path));
      return [...prev, ...newFiles];
    });
    setShowLocalPicker(false);
  };

  const removeFile = (pathToRemove) => {
    setSourceFiles(prev => prev.filter(f => f.path !== pathToRemove));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (sourceFiles.length < 2) {
      setError('Seleziona almeno 2 file per iniziare un torneo.');
      return;
    }
    setCreating(true);
    setError(null);

    const driveFile = sourceFiles.find(f => f.source === 'gdrive' && f.token);
    if (driveFile) localStorage.setItem('gdrive_token', driveFile.token);

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        sourcePath: 'mixed-selection',
        files: sourceFiles.map(f => f.source === 'gdrive' ? `drive:${f.path}` : f.path)
      })
    });

    const data = await res.json();
    setCreating(false);
    if (res.ok) router.push(`/session/${data.id}`);
    else setError(data.error || 'Errore durante la creazione');
  };

  const handleDeleteSession = async (id, name) => {
    if (confirm(`Sei sicuro di voler eliminare "${name}"?`)) {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      const res = await fetch('/api/sessions');
      setSessions(await res.json());
    }
  };

  return (
    <div className="container">
      {showLocalPicker && (
        <LocalFilePicker
          initialType={type}
          onCancel={() => setShowLocalPicker(false)}
          onConfirm={handleFilesSelected}
        />
      )}

      {/* Page header */}
      <div className="page-header">
        <h1>Media Selector <span style={{ WebkitTextFillColor: 'initial' }}>🏆</span></h1>
        <p style={{ color: 'var(--muted)', maxWidth: '480px' }}>
          Confronta e scegli le migliori risorse attraverso un torneo 1 contro 1.
        </p>
      </div>

      <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2rem', alignItems: 'flex-start' }}>

        {/* ── New Session Form ── */}
        <div className="card form-sticky" style={{ position: 'sticky', top: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Nuova Selezione</h2>

          {error && (
            <div style={{
              color: 'var(--danger)', marginBottom: '1rem', padding: '0.85rem 1rem',
              backgroundColor: 'var(--danger-subtle)', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(248,113,113,0.2)', fontSize: '0.9rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label>Nome Selezione</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="es. Selezione Logo Definitivo"
              />
            </div>

            <div>
              <label>Tipo Media</label>
              <div className="type-segmented">
                {[{ v: 'video', icon: '🎬', label: 'Video' }, { v: 'image', icon: '🖼️', label: 'Immagini' }, { v: 'text', icon: '📝', label: 'Testo' }].map(({ v, icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    className={`type-seg-btn${type === v ? ' active' : ''}`}
                    onClick={() => { setType(v); setSourceFiles([]); }}
                  >
                    <span className="seg-icon">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label>Sorgenti</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowLocalPicker(true)}>
                  💻 File Locali
                </button>
                <GoogleDrivePicker initialType={type} onFilesSelected={handleFilesSelected} />
              </div>

              {sourceFiles.length > 0 && (
                <div style={{
                  marginTop: '0.75rem',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{
                    padding: '0.6rem 1rem', borderBottom: '1px solid var(--card-border)',
                    background: 'var(--accent-subtle)', fontSize: '0.85rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <span className="badge badge-accent">{sourceFiles.length}</span>
                    file in coda
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                    {sourceFiles.map((file, idx) => (
                      <li key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 1rem', borderBottom: '1px solid var(--card-border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span className={`badge ${file.source === 'gdrive' ? 'badge-drive' : 'badge-local'}`} style={{ flexShrink: 0 }}>
                            {file.source === 'gdrive' ? '☁️' : '💻'}
                          </span>
                          <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.path)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0, padding: '0 0.25rem', fontSize: '1rem' }}
                          title="Rimuovi"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || sourceFiles.length < 2}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.25rem' }}
            >
              {creating ? '⏳ Creazione in corso...' : `🚀 Avvia Torneo ${sourceFiles.length >= 2 ? `(${sourceFiles.length} file)` : ''}`}
            </button>
          </form>
        </div>

        {/* ── Sessions List ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Le tue selezioni</h2>
            {sessions.length > 0 && (
              <span className="badge badge-accent">{sessions.length}</span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              Caricamento...
            </div>
          ) : sessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', borderStyle: 'dashed' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟️</div>
              <p style={{ color: 'var(--muted)' }}>Nessuna selezione ancora. Creane una per iniziare!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sessions.map(s => (
                <SessionCard
                  key={s.id}
                  s={s}
                  onResume={id => router.push(`/session/${id}`)}
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .session-card { transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        .session-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); border-color: var(--card-border-hover); }

        /* ── Segmented control ── */
        .type-segmented {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-sm);
          padding: 4px;
          gap: 4px;
        }
        .type-seg-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem 0.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .type-seg-btn:hover:not(.active) {
          background: rgba(255,255,255,0.05);
          color: var(--foreground);
        }
        .type-seg-btn.active {
          background: linear-gradient(135deg, var(--accent), #818cf8);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 2px 10px var(--accent-glow);
        }
        .seg-icon { font-size: 1.1rem; }

        @media (max-width: 640px) {
          .type-segmented { grid-template-columns: 1fr; }
          .type-seg-btn { justify-content: flex-start; padding: 0.65rem 1rem; }
          .sources-grid { grid-template-columns: 1fr !important; }
          .session-header-row { flex-direction: column; align-items: flex-start !important; }
          .session-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
}
