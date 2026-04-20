import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { IconManager } from './components/IconManager';
import { ApiKeyManager } from './components/ApiKeyManager';

export type Page = 'dashboard' | 'icons' | 'keys';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'icons' && <IconManager />}
      {page === 'keys' && <ApiKeyManager />}
    </Layout>
  );
}
