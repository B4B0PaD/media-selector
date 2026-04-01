"use client";

import { useState, useEffect, useMemo } from 'react';

export default function MediaViewer({ path, type, onClick, isSelected }) {
  const [textContent, setTextContent] = useState('');
  const [driveToken, setDriveToken] = useState(null);
  
  const isDrive = path.startsWith('drive:');
  const fileId = isDrive ? path.replace('drive:', '') : null;

  useEffect(() => {
    if (isDrive) {
      setDriveToken(localStorage.getItem('gdrive_token'));
    }
  }, [isDrive]);

  const mediaUrl = useMemo(() => {
    if (isDrive) {
      return driveToken ? `/api/drive-media?fileId=${fileId}&token=${driveToken}` : null;
    }
    return `/api/local-media?path=${encodeURIComponent(path)}`;
  }, [isDrive, fileId, driveToken, path]);

  useEffect(() => {
    if (type === 'text' && mediaUrl) {
      fetch(mediaUrl)
        .then(async res => {
           if (res.status === 401) throw new Error("Unauthorized");
           return res.text();
        })
        .then(text => setTextContent(text))
        .catch(err => {
           console.error("Error reading text:", err);
           if (err.message === "Unauthorized") setDriveToken(null);
        });
    }
  }, [type, mediaUrl]);

  const requestToken = (e) => {
    e.stopPropagation();
    if (!window.google) return alert("Google API non caricata.");
    
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response) => {
        if (response.error !== undefined) {
           console.error(response);
           return;
        }
        localStorage.setItem('gdrive_token', response.access_token);
        setDriveToken(response.access_token);
      },
    });
    client.requestAccessToken();
  };

  const handleMediaError = (e) => {
     if (isDrive) setDriveToken(null);
  };

  if (isDrive && !driveToken) {
     return (
       <div 
         className={`media-container ${isSelected ? 'selected' : ''}`}
         onClick={() => onClick(path)}
         style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}
       >
         <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: '#ffb942' }}>⚠️ Token Drive Scaduto</h3>
            <p>È necessario ri-autorizzare l'accesso a Google Drive per continuare a visualizzare questi file.</p>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={requestToken}>
              Riconnettiti a Google Drive
            </button>
         </div>
         <style jsx>{`
           .media-container { width: 100%; height: 60vh; border-radius: 12px; border: 4px solid transparent; cursor: pointer; }
           .media-container.selected { border-color: var(--success); }
         `}</style>
       </div>
     );
  }

  return (
    <div 
      className={`media-container ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(path)}
    >
      {type === 'video' && mediaUrl && (
        <video 
          key={mediaUrl} // Force remount on path change
          controls 
          onError={handleMediaError}
          style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
        >
          <source src={mediaUrl} type="video/mp4" />
          <source src={mediaUrl} type="video/webm" />
          Il tuo browser non supporta il formato video.
        </video>
      )}

      {type === 'image' && mediaUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={mediaUrl} 
          onError={handleMediaError}
          alt="Immagine in comparazione" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {type === 'text' && mediaUrl && (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', boxSizing: 'border-box' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{textContent || 'Caricamento testo...'}</pre>
        </div>
      )}

      <style jsx>{`
        .media-container {
          width: 100%;
          height: 60vh;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
          border: 4px solid transparent;
          position: relative;
        }

        .media-container:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          border-color: rgba(94, 106, 210, 0.5);
        }

        .media-container.selected {
          border-color: var(--success);
          transform: scale(1.03);
          box-shadow: 0 0 20px var(--success);
        }
      `}</style>
    </div>
  );
}
