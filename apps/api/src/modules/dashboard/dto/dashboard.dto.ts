import { ShipmentStatus } from '@logistics/shared';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  carrierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  carrierServiceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  branchId?: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;
}
