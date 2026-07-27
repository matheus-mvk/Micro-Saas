import type { ReactNode } from 'react';

import { AuthenticatedLayout } from '@/features/auth/authenticated-layout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
