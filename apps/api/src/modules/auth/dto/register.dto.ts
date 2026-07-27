import { IsBoolean, IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @Length(2, 140)
  name!: string;

  @IsString()
  @Length(2, 160)
  companyName!: string;

  @IsEmail()
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  password!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  passwordConfirmation!: string;

  @IsBoolean()
  acceptedTerms!: boolean;

  @IsBoolean()
  acceptedPrivacy!: boolean;
}
