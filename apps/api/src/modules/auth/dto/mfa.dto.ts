import { IsString, Length, MinLength } from 'class-validator';

export class ConfirmMfaDto {
  @IsString()
  @Length(6, 16)
  code!: string;
}

export class VerifyMfaLoginDto {
  @IsString()
  @MinLength(24)
  challengeToken!: string;

  @IsString()
  @Length(6, 16)
  code!: string;
}
