import { IsIn, IsOptional, IsString, Length } from 'class-validator';

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
