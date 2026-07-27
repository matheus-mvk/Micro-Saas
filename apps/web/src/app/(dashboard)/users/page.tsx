import { UserManagement } from '@/features/users/user-management';

export default function UsersPage() {
  return (
    <div>
      <h1>Usuarios</h1>
      <p>Controle acesso, convites, MFA e sessoes dos usuarios do tenant.</p>
      <UserManagement />
    </div>
  );
}
