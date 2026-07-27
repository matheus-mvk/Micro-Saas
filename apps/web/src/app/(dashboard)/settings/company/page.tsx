import { CompanySettingsPanel } from '@/features/auth/company-settings-panel';

export default function CompanySettingsPage() {
  return (
    <div>
      <h1>Empresa</h1>
      <p>Consulte os dados do tenant ativo e acesse configuracoes relacionadas.</p>
      <CompanySettingsPanel />
    </div>
  );
}
