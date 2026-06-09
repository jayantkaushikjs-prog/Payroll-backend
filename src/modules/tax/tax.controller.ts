import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxSlabDto } from './dto/create-tax-slab.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('tax')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_TAX_SLABS)
  create(@Body() createDto: CreateTaxSlabDto) {
    return this.taxService.create(createDto);
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_TAX_SLABS)
  findAll() {
    return this.taxService.findAll();
  }

  @Get('year/:year')
  @RequirePermissions(Permission.MANAGE_TAX_SLABS)
  findByFinancialYear(@Param('year') year: string) {
    return this.taxService.findByFinancialYear(year);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_TAX_SLABS)
  remove(@Param('id') id: string) {
    return this.taxService.remove(+id);
  }
}
