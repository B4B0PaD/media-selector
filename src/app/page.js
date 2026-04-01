"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LocalFilePicker from '@/components/LocalFilePicker';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';

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
      .then(data => {
        setSessions(data);
        setLoading(false);
      });
  }, []);

  const handleFilesSelected = (files) => {
    if (files.length === 0) return;
    
    // Add only new files to avoid duplicates based on 'path'
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
      setError('Devi selezionare almeno 2 file per iniziare un torneo.');
      return;
    }

    setCreating(true);
    setError(null);

    // If Google Drive files exist, store the token temporarily 
    const driveFile = sourceFiles.find(f => f.source === 'gdrive' && f.token);
    if (driveFile) {
       localStorage.setItem('gdrive_token', driveFile.token);
    }

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

    if (res.ok) {
      router.push(`/session/${data.id}`);
    } else {
      setError(data.error || 'Failed to create selection');
    }
  };

  const handleDeleteSession = async (id, name) => {
    if (confirm(`Sei sicuro di voler eliminare la selezione "${name}"?`)) {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      // Refresh list
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    }
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      <h1>Media Selector 🏆</h1>
      <p style={{ marginBottom: '2rem', color: '#a1a9b3' }}>
        Confronta e seleziona le migliori risorse in stile torneo.
      </p>

      {showLocalPicker && (
        <LocalFilePicker 
          initialType={type} 
          onCancel={() => setShowLocalPicker(false)} 
          onConfirm={handleFilesSelected} 
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* New Session Form */}
        <div className="card">
          <h2>Nuova Selezione</h2>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(207,81,81,0.1)', borderRadius: '8px' }}>{error}</div>}
          
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Nome Selezione</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="es. Scelta Logo Definitivo" 
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tipo Media</label>
              <select value={type} onChange={(e) => {
                setType(e.target.value);
                setSourceFiles([]); // Clear selection when type changes
              }}>
                <option value="video">Video</option>
                <option value="image">Immagini</option>
                <option value="text">Testo</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>Seleziona File da Esaminare</label>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowLocalPicker(true)}
                  style={{ flex: 1 }}
                >
                  Sfoglia File Locali
                </button>
                <div style={{ flex: 1, display: 'flex' }}>
                   <GoogleDrivePicker 
                     initialType={type} 
                     onFilesSelected={handleFilesSelected} 
                   />
                </div>
              </div>

              {sourceFiles.length > 0 && (
                <div style={{ marginTop: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--card-border)', backgroundColor: 'rgba(94, 106, 210, 0.1)' }}>
                    ✅ <strong>{sourceFiles.length} file selezionati in coda</strong>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                    {sourceFiles.map((file, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid var(--card-border)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '1rem' }}>
                          <span style={{ fontSize: '0.9rem', color: file.source === 'gdrive' ? '#4285F4' : '#00C853', marginRight: '0.5rem', fontWeight: 'bold' }}>
                            {file.source === 'gdrive' ? '[Drive]' : '[Locale]'}
                          </span>
                          <span title={file.name}>{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeFile(file.path)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
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

            <button type="submit" className="btn btn-primary" disabled={creating || sourceFiles.length < 2} style={{ width: '100%' }}>
              {creating ? 'Creazione in corso...' : 'Inizia Torneo'}
            </button>
          </form>
        </div>

        {/* Existing Sessions List */}
        <div>
          <h2>Le tue selezioni</h2>
          {loading ? (
            <p>Caricamento...</p>
          ) : sessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: '#a1a9b3' }}>Nessuna selezione presente. Creane una per iniziare!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sessions.map(s => {
                const totalItems = s.queue.length + s.nextRoundQueue.length;
                const isWinner = !!s.winner;
                
                return (
                  <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{s.name}</h3>
                      <div style={{ fontSize: '0.9rem', color: '#a1a9b3', marginTop: '0.4rem' }}>
                        Type: {s.type} • {isWinner ? 'Vincitore Decretato: 🏆' : `Rimanenti: ${totalItems}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => router.push(`/session/${s.id}`)} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                        {isWinner ? 'Vedi Risultati' : 'Riprendi'}
                      </button>
                      <button onClick={() => handleDeleteSession(s.id, s.name)} className="btn btn-outline" style={{ whiteSpace: 'nowrap', borderColor: '#4a2525', color: 'var(--danger)' }} title="Elimina Selezione">
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
