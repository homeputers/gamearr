import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
      <nav className="p-2 flex gap-4 bg-gray-100">
        <Link to="/libraries">Libraries</Link>
        <Link to="/unmatched">Unmatched</Link>
        <Link to="/games">Games</Link>
        <Link to="/activity">Activity</Link>
        <Link to="/downloads">Downloads</Link>
        <Link to="/settings">Settings</Link>
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
