"use client";

import { useState, useEffect } from 'react';

export default function LocalFilePicker({ onCancel, onConfirm, initialType }) {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [error, setError] = useState(null);

  const fetchPath = async (p = '') => {
    setLoading(true);
    setError(null);
    try {
      const u = new URL('/api/explore', window.location.origin);
      if (p) u.searchParams.set('path', p);
      
      const res = await fetch(u.toString());
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Errore di lettura percorso');
      }
      const data = await res.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      
      const filteredItems = data.items.filter(item => {
        if (item.isDirectory) return true;
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (initialType === 'video') return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);
        if (initialType === 'image') return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
        if (initialType === 'text') return ['txt', 'md', 'json', 'csv'].includes(ext);
        return true;
      });

      setItems(filteredItems);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPath('');
  }, []);

  const toggleSelect = (item) => {
    if (item.isDirectory) return;

    const newSel = new Set(selectedPaths);
    // Find if already selected
    let found = false;
    for (let p of newSel) {
      if (p.path === item.path) {
        newSel.delete(p);
        found = true;
        break;
      }
    }
    if (!found) {
      newSel.add(item);
    }
    setSelectedPaths(newSel);
  };

  const isSelected = (path) => {
    for (let p of selectedPaths) {
      if (p.path === path) return true;
    }
    return false;
  };

  const handleConfirm = () => {
    // Return array of selected items with metadata
    onConfirm(Array.from(selectedPaths).map(p => ({
      path: p.path,
      name: p.name,
      source: 'local'
    })));
  };

  return (
    <div className="modal-overlay">
      <div className="picker-modal card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Esplora File Locali</h2>
          <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={onCancel}>✕</button>
        </div>

        <div style={{ marginBottom: '1rem', backgroundColor: '#121419', padding: '0.75rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
             className="btn btn-outline" 
             style={{ padding: '0.4rem 0.8rem' }} 
             disabled={parentPath === null} 
             onClick={() => fetchPath(parentPath)}
          >
            ← Su
          </button>
          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentPath || 'Questo PC'}
          </div>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        <div className="items-list">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '2rem' }}>Caricamento in corso...</div>
          ) : items.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '2rem', color: '#a1a9b3' }}>Nessun file compatibile trovato ('{initialType}').</div>
          ) : (
            items.map((item, idx) => (
              <div 
                key={idx} 
                className="item-row"
                onClick={() => {
                  if (item.isDirectory) {
                    fetchPath(item.path);
                  } else {
                    toggleSelect(item);
                  }
                }}
              >
                {!item.isDirectory && (
                  <input 
                    type="checkbox" 
                    checked={isSelected(item.path)} 
                    onChange={() => toggleSelect(item)} 
                    onClick={e => e.stopPropagation()}
                    style={{ width: 'auto', marginRight: '10px' }}
                  />
                )}
                <span style={{ fontSize: '1.2rem', marginRight: '1rem' }}>
                  {item.isDirectory ? '📁' : '📄'}
                </span>
                <span style={{ cursor: 'pointer', flex: 1 }}>{item.name}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
          <div style={{ color: '#a1a9b3' }}>
            {selectedPaths.size} file selezionati in questa cartella
          </div>
          <button 
            className="btn btn-primary" 
            disabled={selectedPaths.size === 0} 
            onClick={handleConfirm}
          >
            Aggiungi file alla Lista ({selectedPaths.size})
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 2rem;
        }
        .picker-modal { width: 100%; max-width: 800px; height: 80vh; display: flex; flex-direction: column; }
        .items-list {
          flex: 1; overflow-y: auto;
          border: 1px solid var(--card-border); border-radius: 8px; background: #0f1115;
        }
        .item-row {
          display: flex; alignItems: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--card-border);
        }
        .item-row:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
