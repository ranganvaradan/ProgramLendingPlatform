import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Anchor Portal</h1>
      <p>Manage programs, view borrowers, and monitor utilization.</p>
      <p style={{ color: '#666' }}>Coming in Phase 2...</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
