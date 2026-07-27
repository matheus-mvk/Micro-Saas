import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class AddressInputDto {
  @IsString()
  @Length(8, 16)
  postalCode!: string;

  @IsString()
  @Length(2, 160)
  street!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  number?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string | null;

  @IsString()
  @Length(2, 120)
  city!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}

export class FreightPackageDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(999)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  weightKg!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  lengthCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  widthCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  heightCm!: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string | null;
}

export class CreateFreightSimulationDto {
  @IsOptional()
  @IsString()
  @MaxLength(36)
  customerId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  carrierId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  carrierServiceId?: string | null;

  @IsOptional()
  @IsDateString()
  desiredShipDate?: string | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cargoValue!: number;

  @ValidateNested()
  @Type(() => AddressInputDto)
  origin!: AddressInputDto;

  @ValidateNested()
  @Type(() => AddressInputDto)
  destination!: AddressInputDto;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FreightPackageDto)
  packages!: FreightPackageDto[];
}

export class ListFreightSimulationsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(36)
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  originPostalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  destinationPostalCode?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
