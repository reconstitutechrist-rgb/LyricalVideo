import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App'; // Original layout
import App from './AppWithNewLayout'; // New modernized layout
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastContainer } from './src/components/Toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer />
    </ErrorBoundary>
  </React.StrictMode>
);
