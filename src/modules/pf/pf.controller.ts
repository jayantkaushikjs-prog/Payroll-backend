import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { PFService } from './pf.service';
import { CreatePFSettingsDto } from './dto/create-pf-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('pf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PFController {
  constructor(private readonly pfService: PFService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_PF_SETTINGS)
  create(@Body() createDto: CreatePFSettingsDto) {
    return this.pfService.create(createDto);
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_PF_SETTINGS)
  findAll() {
    return this.pfService.findAll();
  }

  @Get('active')
  @RequirePermissions(Permission.MANAGE_PF_SETTINGS)
  findActive(@Query('date') date?: string) {
    const checkDate = date || new Date().toISOString().split('T')[0];
    return this.pfService.findActiveAtDate(checkDate);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_PF_SETTINGS)
  remove(@Param('id') id: string) {
    return this.pfService.remove(+id);
  }
}
