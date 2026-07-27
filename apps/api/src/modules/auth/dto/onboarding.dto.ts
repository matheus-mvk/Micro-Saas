import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOnboardingDto {
  @IsOptional()
  @IsBoolean()
  companyDone?: boolean;

  @IsOptional()
  @IsBoolean()
  branchDone?: boolean;

  @IsOptional()
  @IsBoolean()
  inviteDone?: boolean;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  currentStep?: string;
}
