import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { BlacklistedToken } from './blacklisted-token.entity';
import { Role } from '../../common/enums/role.enum';

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({ email: 'google.user@example.com', name: 'Google User' }),
    }),
  })),
}));

describe('AuthService loginWithGoogle', () => {
  it('issues tokens for a Google-authenticated user', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 42, email: 'google.user@example.com', role: Role.HR }),
    } as unknown as UsersService;

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as JwtService;

    const refreshTokenRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<RefreshToken>;

    const blacklistedTokenRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<BlacklistedToken>;

    const service = new AuthService(usersService, jwtService, refreshTokenRepo, blacklistedTokenRepo);

    const result = await service.loginWithGoogle('credential-token');

    expect(result.access_token).toBe('signed-token');
    expect(result.refresh_token).toBe('signed-token');
    expect(result.user.email).toBe('google.user@example.com');
  });
});
