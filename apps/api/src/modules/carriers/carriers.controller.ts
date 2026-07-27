import { UserRole, type CarrierDto, type CarrierTransportServiceDto, type PaginatedResult } from '@logistics/shared';
import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req, Res, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiProduces } from '@nestjs/swagger';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { CarriersService } from './carriers.service';
import { CreateCarrierDto, CreateCarrierServiceDto, ListCarriersDto, UpdateCarrierDto, UpdateCarrierServiceDto, UpdateCarrierStatusDto } from './dto/carrier.dto';
import type { RequestWithContext } from '../../common/types/request-context';

@ApiBearerAuth()
@ApiTags('carriers')
@Controller('carriers')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class CarriersController {
  constructor(private readonly carriers: CarriersService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListCarriersDto): Promise<PaginatedResult<CarrierDto>> {
    return this.carriers.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<CarrierDto> { return this.carriers.get(tenantId, id); }

  @Get(':id/logo')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @Header('cache-control', 'private, max-age=300')
  /** Streams the tenant-authorized carrier logo through the API instead of exposing raw storage paths. */
  async logo(@CurrentTenant() tenantId: string, @Param('id') id: string, @Res() response: Response): Promise<void> {
    const image = await this.carriers.readLogo(tenantId, id);
    response.type(image.contentType).send(image.buffer);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@CurrentTenant() tenantId: string, @Body() body: CreateCarrierDto): Promise<CarrierDto> {
    return this.carriers.create(tenantId, body);
  }

  @Post(':carrierId/services')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createService(
    @CurrentTenant() tenantId: string,
    @Param('carrierId') carrierId: string,
    @Body() body: CreateCarrierServiceDto,
  ): Promise<CarrierTransportServiceDto> {
    return this.carriers.createService(tenantId, carrierId, body);
  }

  @Post(':id/logo')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Carrier logo uploaded and carrier data updated.' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 }, storage: memoryStorage() }))
  /** Uploads a small carrier logo synchronously and updates the Carrier record in the same request. */
  uploadLogo(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<CarrierDto> {
    return this.carriers.uploadLogo(tenantId, requireUserId(request), id, file);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateCarrierDto): Promise<CarrierDto> {
    return this.carriers.update(tenantId, requireUserId(request), id, body);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateCarrierStatusDto): Promise<CarrierDto> {
    return this.carriers.updateStatus(tenantId, requireUserId(request), id, body.active);
  }

  @Patch(':carrierId/services/:serviceId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateService(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('carrierId') carrierId: string, @Param('serviceId') serviceId: string, @Body() body: UpdateCarrierServiceDto): Promise<CarrierTransportServiceDto> {
    return this.carriers.updateService(tenantId, requireUserId(request), carrierId, serviceId, body);
  }
}

function requireUserId(request: RequestWithContext): string {
  if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.');
  return request.context.userId;
}
