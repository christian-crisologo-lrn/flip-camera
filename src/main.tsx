import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LogProvider } from './hooks/LogContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LogProvider>
      <App />
    </LogProvider>
  </React.StrictMode>,
);
