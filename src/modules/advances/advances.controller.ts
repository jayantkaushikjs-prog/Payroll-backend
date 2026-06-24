import { Controller, Get, Post, Put, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { CreateAdvanceLogDto } from './dto/create-advance-log.dto';
import { UpdateAdvanceLogDto } from './dto/update-advance-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('advances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  create(@Body() createDto: CreateAdvanceDto) {
    return this.advancesService.create(createDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_ADVANCES)
  findAll() {
    return this.advancesService.findAll();
  }

  @Get('employee/:employeeId')
  @RequirePermissions(Permission.VIEW_ADVANCES)
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.advancesService.findByEmployee(+employeeId);
  }

  @Put(':id')
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  update(@Param('id') id: string, @Body() updateDto: UpdateAdvanceDto) {
    return this.advancesService.update(+id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  remove(@Param('id') id: string) {
    return this.advancesService.remove(+id);
  }

  @Post(':id/manual-return')
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  manualReturn(@Param('id') id: string, @Body() dto: { amount: number; date: string; notes?: string }) {
    return this.advancesService.manualReturn(+id, dto);
  }

  // ─── Advance Logs ─────────────────────────────────────────────────────────────

  @Post('logs')
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  createLog(@Body() dto: CreateAdvanceLogDto) {
    return this.advancesService.createLog(dto);
  }

  @Get('logs')
  @RequirePermissions(Permission.VIEW_ADVANCES)
  findAllLogs() {
    return this.advancesService.findAllLogs();
  }

  @Get('logs/employee/:employeeId')
  @RequirePermissions(Permission.VIEW_ADVANCES)
  findLogsByEmployee(@Param('employeeId') employeeId: string) {
    return this.advancesService.findLogsByEmployee(+employeeId);
  }

  @Put('logs/:id')
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  updateLog(@Param('id') id: string, @Body() dto: UpdateAdvanceLogDto) {
    return this.advancesService.updateLog(+id, dto);
  }

  @Delete('logs/:id')
  @RequirePermissions(Permission.MANAGE_ADVANCES)
  removeLog(@Param('id') id: string) {
    return this.advancesService.removeLog(+id);
  }
}
