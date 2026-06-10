import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RefreshToken } from './refresh-token.entity';
import { BlacklistedToken } from './blacklisted-token.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken, BlacklistedToken]),
    JwtModule.register({
      global: true,
      secret: 'PAYROLL_SECRET_JWT_KEY_987654321',
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}

