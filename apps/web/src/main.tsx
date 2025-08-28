import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { Providers } from './app/providers';
import { Layout } from './app/layout';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Providers>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>,
);
