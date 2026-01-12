import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Global error handler to catch boot-up issues and display them
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 20px; color: #f87171; background: #111827; height: 100vh; font-family: sans-serif;">
        <h1 style="font-size: 20px; margin-bottom: 10px;">Application Load Error</h1>
        <p style="color: #94a3b8; font-size: 14px;">The application failed to start. This is often due to missing environment variables or file resolution issues.</p>
        <pre style="background: #1f2937; padding: 15px; border-radius: 8px; overflow: auto; margin-top: 20px; font-size: 12px; border: 1px solid #374151;">${event.message}\nat ${event.filename}:${event.lineno}</pre>
        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Tip: Ensure you are serving this directory with a web server (e.g., <code>npx serve</code> or <code>python3 -m http.server</code>) and not opening the HTML file directly.</p>
      </div>
    `;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);