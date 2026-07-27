'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { authQueryKeys, getCurrentSession } from '@/services/auth-service';
import { ApiClientError, ApiConnectionError } from '@/services/http-client';

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: getCurrentSession,
    retry: false,
  });

  useEffect(() => {
    if (session.error instanceof ApiClientError && session.error.response.statusCode === 401) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?reason=session-expired&next=${next}`);
    }
  }, [pathname, router, session.error]);

  if (session.isPending) {
    return <main style={{ padding: '1.5rem' }}>Carregando sessao administrativa...</main>;
  }

  if (session.error) {
    const message =
      session.error instanceof ApiConnectionError
        ? 'A API nao respondeu. Confirme se o backend esta disponivel e tente novamente.'
        : 'Nao foi possivel validar sua sessao agora.';

    return (
      <main style={{ display: 'grid', gap: '0.75rem', padding: '1.5rem' }} role="alert">
        <h1 style={{ margin: 0 }}>Falha ao validar sessao</h1>
        <p style={{ margin: 0 }}>{message}</p>
        <button style={{ justifySelf: 'start' }} type="button" onClick={() => void session.refetch()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  return <AppShell user={session.data.user}>{children}</AppShell>;
}
