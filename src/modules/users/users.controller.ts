import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_USERS)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_USERS)
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_USERS)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_USERS)
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Post(':id/resend-invitation')
  @RequirePermissions(Permission.MANAGE_USERS)
  resendInvitation(@Param('id') id: string) {
    return this.usersService.resendInvitation(+id);
  }
}
