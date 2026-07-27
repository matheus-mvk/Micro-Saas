import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, IsDateString, Min, ValidateNested } from 'class-validator';
import { FreightChargeType, FreightRateTableStatus, ShipmentStatus, TrackingEventType } from '@prisma/client';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class ListAdminLogisticsDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsEnum(ShipmentStatus) status?: ShipmentStatus;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;
}

export class CreateTrackingEventDto {
  @IsEnum(TrackingEventType)
  eventType!: TrackingEventType;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotencyKey?: string;
}

export class CoverageDto {
  @IsString() carrierServiceId!: string;
  @IsOptional() @IsString() @MaxLength(2) originState?: string;
  @IsOptional() @IsString() @MaxLength(2) destinationState?: string;
  @IsOptional() @IsString() @MaxLength(16) originPostalCodeStart?: string;
  @IsOptional() @IsString() @MaxLength(16) originPostalCodeEnd?: string;
  @IsOptional() @IsString() @MaxLength(16) destinationPostalCodeStart?: string;
  @IsOptional() @IsString() @MaxLength(16) destinationPostalCodeEnd?: string;
}

export class CoverageTestDto {
  @IsString() originPostalCode!: string;
  @IsString() destinationPostalCode!: string;
  @IsOptional() @IsString() carrierServiceId?: string;
}

export class RateRangeInputDto {
  @Type(() => Number) @IsNumber() @Min(0) minWeightKg!: number;
  @Type(() => Number) @IsNumber() @Min(0) maxWeightKg!: number;
  @Type(() => Number) @IsNumber() @Min(0) basePrice!: number;
  @Type(() => Number) @IsNumber() @Min(0) pricePerKg!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) excessPricePerKg?: number;
  @Type(() => Number) @IsNumber() @Min(1) deadlineDays!: number;
  @IsOptional() @Type(() => Number) @IsNumber() priority?: number;
}

export class RateChargeInputDto {
  @IsEnum(FreightChargeType) type!: FreightChargeType;
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) fixedAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) percentage?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class RateTableInputDto {
  @IsString() @MaxLength(140) name!: string;
  @IsString() carrierServiceId!: string;
  @IsString() @MaxLength(3) currency!: string;
  @IsDateString() validFrom!: string;
  @IsOptional() @IsDateString() validTo?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(FreightRateTableStatus) status?: FreightRateTableStatus;
  @IsOptional() @IsArray() @IsString({ each: true }) coverageIds?: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => RateRangeInputDto) ranges!: RateRangeInputDto[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => RateChargeInputDto) charges!: RateChargeInputDto[];
}
