import { IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class StartOAuthDto {
  @IsIn(['login', 'register', 'link'])
  mode!: 'login' | 'register' | 'link';

  @IsOptional()
  @IsString()
  @Length(2, 160)
  companyName?: string;
}

export class OAuthCallbackDto {
  @IsString()
  code!: string;

  @IsString()
  state!: string;
}

export class CompleteOAuthRegistrationDto {
  @IsString()
  @MinLength(24)
  token!: string;

  @IsString()
  @Length(2, 80)
  tenantSlug!: string;
}
