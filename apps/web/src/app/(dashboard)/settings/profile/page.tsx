import { ProfileSecurity } from '@/features/auth/profile-security';

export default function ProfilePage() {
  return (
    <div>
      <h1>Perfil e seguranca</h1>
      <p>Gerencie sua identidade, senha, MFA, providers OAuth e sessoes ativas.</p>
      <ProfileSecurity />
    </div>
  );
}
