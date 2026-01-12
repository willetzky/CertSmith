import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Basic error logging for development
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Fatal App Error:', { message, source, lineno, colno, error });
};