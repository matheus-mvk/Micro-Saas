import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  newPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(120)
  newPasswordConfirmation!: string;
}
