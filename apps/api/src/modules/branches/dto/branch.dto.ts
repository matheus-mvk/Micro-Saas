import { IsBoolean, IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ListBranchesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @Length(2, 2) state?: string;
}

export class CreateBranchDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(2, 40)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  postalCode?: string;

  @IsOptional() @IsEmail() @MaxLength(180)
  email?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(120)
  complement?: string;

  @IsOptional() @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @IsOptional()
  @IsBoolean()
  main?: boolean;
}

export class UpdateBranchDto extends CreateBranchDto {}

export class UpdateBranchStatusDto {
  @IsBoolean()
  active!: boolean;
}
