import { Type } from 'class-transformer';
import { CarrierServiceStatus } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ListCarriersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() hasActiveService?: boolean;
}

export class CreateCarrierDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  document?: string;

  @IsOptional() @IsString() @MaxLength(40)
  stateRegistration?: string;

  @IsOptional() @IsEmail() @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  site?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCarrierServiceDto {
  @IsString()
  @Length(2, 40)
  code!: string;

  @IsString()
  @Length(2, 140)
  name!: string;

  @IsString()
  @Length(2, 60)
  modality!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  defaultDeadlineDays!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cubicFactor!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeightKg?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxLengthCm?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxWidthCm?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxHeightCm?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumValue!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class UpdateCarrierDto extends CreateCarrierDto {}

export class UpdateCarrierStatusDto {
  @IsBoolean()
  active!: boolean;
}

export class UpdateCarrierServiceDto extends CreateCarrierServiceDto {
  @IsOptional()
  @IsEnum(CarrierServiceStatus)
  status?: CarrierServiceStatus;
}
