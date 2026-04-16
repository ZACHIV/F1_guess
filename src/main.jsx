import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './player/App.jsx';
import './player/index.css';

ReactDOM.createRoot(document.querySelector('#app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
