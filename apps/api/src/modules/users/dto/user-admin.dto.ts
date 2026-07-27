import { UserRole, UserStatus } from '@logistics/shared';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ListUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;

  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(120)
  password?: string;

  @IsOptional()
  @IsBoolean()
  passwordChangeRequired?: boolean;
}

export class InviteUserDto {
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

export class AcceptInviteDto {
  @IsString()
  @MinLength(24)
  token!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  password!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  passwordConfirmation!: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
