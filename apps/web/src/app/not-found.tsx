import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: '2rem' }}>
      <section style={{ maxWidth: 520 }}>
        <h1>Pagina nao encontrada</h1>
        <p>O endereco solicitado nao existe ou nao esta disponivel para este acesso.</p>
        <Link href="/">Voltar ao inicio</Link>
      </section>
    </main>
  );
}
