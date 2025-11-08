import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- 1. Import Redux Provider and our store ---
import { Provider } from 'react-redux';
import { store } from './redux/store.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* --- 2. Wrap the entire App in the Provider --- */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);