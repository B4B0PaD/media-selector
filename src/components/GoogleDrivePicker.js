"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function GoogleDrivePicker({ onFilesSelected, initialType }) {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  
  // Use environment variables (client side via NEXT_PUBLIC)
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (gapiLoaded && gisLoaded && CLIENT_ID) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response) => {
          if (response.error !== undefined) {
             throw (response);
          }
          createPicker(response.access_token);
        },
      });
      setTokenClient(client);
    }
  }, [gapiLoaded, gisLoaded, CLIENT_ID]);

  const onGapiLoad = () => {
    window.gapi.load('picker', () => {
      setGapiLoaded(true);
    });
  };

  const onGisLoad = () => {
    setGisLoaded(true);
  };

  const handleAuthAndPick = () => {
    if (!API_KEY || !CLIENT_ID) {
      alert("API KEY o CLIENT ID mancanti in .env.local!");
      return;
    }
    // Check if we already have an unexpired token in memory (simple flow)
    tokenClient.requestAccessToken({ prompt: '' });
  };

  const createPicker = (accessToken) => {
    let view = new google.picker.DocsView();
    // Filter based on selected media type
    if (initialType === 'video') view.setMimeTypes('video/mp4,video/webm,video/ogg');
    else if (initialType === 'image') view.setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,image/gif');
    else if (initialType === 'text') view.setMimeTypes('text/plain,application/pdf'); // Added base types

    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setCallback((data) => pickerCallback(data, accessToken))
      .build();
    picker.setVisible(true);
  };

  const pickerCallback = (data, accessToken) => {
    if (data.action === google.picker.Action.PICKED) {
      const docs = data.docs;
      const formattedFiles = docs.map(doc => ({
        path: doc.id,
        name: doc.name,
        source: 'gdrive',
        token: accessToken // Save token temporarily to stream
      }));
      onFilesSelected(formattedFiles);
    }
  };

  return (
    <>
      <Script src="https://apis.google.com/js/api.js" onLoad={onGapiLoad} strategy="afterInteractive" />
      <Script src="https://accounts.google.com/gsi/client" onLoad={onGisLoad} strategy="afterInteractive" />
      
      <button 
        type="button" 
        className="btn btn-outline" 
        onClick={handleAuthAndPick}
        style={{ borderColor: '#4285F4', color: '#4285F4' }}
      >
        <span>Scegli da Google Drive</span>
      </button>
    </>
  );
}
