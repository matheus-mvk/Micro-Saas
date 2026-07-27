import { AddressType } from '@logistics/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ListCustomersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  active?: boolean;
}

export class CreateCustomerDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  document?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  document?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

export class UpdateCustomerStatusDto {
  @IsBoolean()
  active!: boolean;
}

export class CreateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  type?: AddressType;

  @IsString()
  @Length(8, 16)
  postalCode!: string;

  @IsString()
  @Length(2, 160)
  street!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsString()
  @Length(2, 120)
  city!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsOptional()
  @IsBoolean()
  main?: boolean;

  @IsOptional()
  @IsBoolean()
  pickup?: boolean;

  @IsOptional()
  @IsBoolean()
  delivery?: boolean;
}
