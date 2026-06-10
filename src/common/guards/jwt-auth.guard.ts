import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { BlacklistedToken } from '../../modules/auth/blacklisted-token.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.dataSource
      .getRepository(BlacklistedToken)
      .findOne({ where: { token } });
    if (isBlacklisted) {
      throw new UnauthorizedException('Access token has been revoked');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'PAYROLL_SECRET_JWT_KEY_987654321',
      });
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Access token is invalid or expired');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
