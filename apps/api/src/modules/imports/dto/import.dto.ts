import { ImportStatus, ImportType, type ImportDuplicateStrategy } from '@logistics/shared';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ListImportsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(ImportType)
  type?: ImportType;

  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  userId?: string;
}

export class ImportPreviewDto {
  @IsEnum(ImportType)
  type!: ImportType;
}

export class CreateImportDto {
  @IsEnum(ImportType)
  type!: ImportType;

  @Transform(({ value }) => parseJsonObject(value))
  @IsObject()
  mapping!: Record<string, string>;

  @IsOptional()
  @IsIn(['SKIP', 'UPDATE', 'FAIL'])
  duplicateStrategy?: ImportDuplicateStrategy;
}

export class ImportRowsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}

export class RetryImportDto {
  @IsOptional()
  @Transform(({ value }) => parseJsonObject(value))
  @IsObject()
  mapping?: Record<string, string>;

  @IsOptional()
  @IsIn(['SKIP', 'UPDATE', 'FAIL'])
  duplicateStrategy?: ImportDuplicateStrategy;
}

export class NumericIdParamDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id!: number;
}

function parseJsonObject(value: unknown): Record<string, string> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value as Record<string, string>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}
