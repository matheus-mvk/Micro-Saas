import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(180)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(24)
  token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  password!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  passwordConfirmation!: string;
}
