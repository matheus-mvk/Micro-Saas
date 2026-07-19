import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/providers/app-providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Nexora Freight',
  description: 'Inteligencia logistica multi-tenant para controle e analise de fretes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
