'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: '2rem' }}>
      <section style={{ maxWidth: 520 }}>
        <h1>Falha ao carregar</h1>
        <p>Uma falha impediu a exibicao desta pagina.</p>
        <button onClick={reset}>Tentar novamente</button>
      </section>
    </main>
  );
}
