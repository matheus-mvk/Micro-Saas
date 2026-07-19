import type { UserRole } from '@logistics/shared';
import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../constants/metadata.constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
