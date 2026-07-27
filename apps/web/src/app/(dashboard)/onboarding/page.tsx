import { OnboardingPanel } from '@/features/auth/onboarding-panel';

export default function OnboardingPage() {
  return (
    <div>
      <h1>Onboarding</h1>
      <p>Configure o essencial do tenant sem bloquear sua operacao.</p>
      <OnboardingPanel />
    </div>
  );
}
