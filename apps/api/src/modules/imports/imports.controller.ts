import { ImportType, UserRole, type ImportJobDetailDto, type ImportJobDto, type ImportPreviewDto, type ImportTemplateDto, type PaginatedResult } from '@logistics/shared';
import { Body, Controller, Get, Header, Param, Post, Query, Req, Res, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';

import { CreateImportDto, ImportPreviewDto as ImportPreviewBodyDto, ImportRowsQueryDto, ListImportsDto, RetryImportDto } from './dto/import.dto';
import { ImportsService } from './imports.service';

@ApiBearerAuth()
@ApiTags('imports')
@Controller('imports')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Query() query: ListImportsDto,
  ): Promise<PaginatedResult<ImportJobDto>> {
    return this.imports.list({ role: requireRole(request), tenantId, userId: requireUserId(request) }, query);
  }

  @Get('templates/:type')
  template(@Param('type') type: ImportType): ImportTemplateDto {
    return this.imports.template(type);
  }

  @Post('preview')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  preview(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: ImportPreviewBodyDto,
  ): ImportPreviewDto {
    return this.imports.preview(file, { type: body.type });
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 }, storage: memoryStorage() }))
  create(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateImportDto,
  ): Promise<ImportJobDto> {
    return this.imports.create({ requestId: request.context.requestId, tenantId, userId: requireUserId(request) }, file, body);
  }

  @Get(':id')
  get(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') importJobId: string,
    @Query() query: ImportRowsQueryDto,
  ): Promise<ImportJobDetailDto> {
    return this.imports.get({ role: requireRole(request), tenantId, userId: requireUserId(request) }, importJobId, query);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') importJobId: string,
  ): Promise<ImportJobDto> {
    return this.imports.cancel({ role: requireRole(request), tenantId, userId: requireUserId(request) }, importJobId);
  }

  @Post(':id/retry')
  retry(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') importJobId: string,
    @Body() body: RetryImportDto,
  ): Promise<ImportJobDto> {
    return this.imports.retry({ role: requireRole(request), tenantId, userId: requireUserId(request) }, importJobId, body);
  }

  @Get(':id/errors.csv')
  @Header('content-type', 'text/csv; charset=utf-8')
  async errorsCsv(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Res() response: Response,
    @Param('id') importJobId: string,
  ): Promise<void> {
    const report = await this.imports.errorReport({ role: requireRole(request), tenantId, userId: requireUserId(request) }, importJobId);
    response.setHeader('content-disposition', `attachment; filename="${report.filename}"`);
    response.send(report.content);
  }
}

function requireUserId(request: RequestWithContext): string {
  const userId = request.context.userId;
  if (!userId) throw new UnauthorizedException('Authentication context is required.');
  return userId;
}

function requireRole(request: RequestWithContext): UserRole {
  const role = request.context.role;
  if (!role) throw new UnauthorizedException('Authentication context is required.');
  return role;
}
