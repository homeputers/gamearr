import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { Libraries } from './pages/Libraries';
import { Unmatched } from './pages/Unmatched';
import { Games } from './pages/Games';
import { Activity } from './pages/Activity';
import { Downloads } from './pages/Downloads';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 flex gap-4 bg-white shadow">
        <Link className="text-blue-600 hover:underline" to="/libraries">
          Libraries
        </Link>
        <Link className="text-blue-600 hover:underline" to="/unmatched">
          Unmatched
        </Link>
        <Link className="text-blue-600 hover:underline" to="/games">
          Games
        </Link>
        <Link className="text-blue-600 hover:underline" to="/activity">
          Activity
        </Link>
        <Link className="text-blue-600 hover:underline" to="/downloads">
          Downloads
        </Link>
        <Link className="text-blue-600 hover:underline" to="/settings">
          Settings
        </Link>
      </nav>
      <Routes>
        <Route path="/libraries" element={<Libraries />} />
        <Route path="/unmatched" element={<Unmatched />} />
        <Route path="/games" element={<Games />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Libraries />} />
      </Routes>
      <footer className="p-4 text-center text-xs text-gray-500">
        Use only with games you own and follow the terms of service for all
        providers.
      </footer>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
