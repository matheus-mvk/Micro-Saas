import { ImportDetail } from '@/features/imports/import-detail';

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ImportDetail id={id} />;
}
