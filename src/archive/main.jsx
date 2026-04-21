import React from 'react';
import ReactDOM from 'react-dom/client';
import ArchiveApp from './ArchiveApp.jsx';
import './archive.css';

ReactDOM.createRoot(document.querySelector('#app')).render(
  <React.StrictMode>
    <ArchiveApp />
  </React.StrictMode>
);
