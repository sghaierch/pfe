import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // ✅ FIX : StrictMode réactivé — détecte les problèmes React en développement
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();