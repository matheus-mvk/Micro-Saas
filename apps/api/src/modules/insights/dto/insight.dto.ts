import { InsightCategory, InsightSeverity, InsightStatus } from '@logistics/shared';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ListInsightsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(InsightCategory)
  category?: InsightCategory;

  @IsOptional()
  @IsEnum(InsightSeverity)
  severity?: InsightSeverity;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(InsightStatus)
  status?: InsightStatus;
}
