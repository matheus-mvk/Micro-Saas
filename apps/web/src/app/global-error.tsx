'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: '2rem' }}>
          <section style={{ maxWidth: 520 }}>
            <h1>Erro inesperado</h1>
            <p>A aplicacao nao conseguiu continuar com seguranca.</p>
            <button onClick={reset}>Recarregar</button>
          </section>
        </main>
      </body>
    </html>
  );
}
