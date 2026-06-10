import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';
import { sendMail } from '../../common/utils/smtp-client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, reset_token, reset_token_expires, ...result } = user;
    return result;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('Email not registered');
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP (SHA-256) before storing it in the database for optimal security
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.reset_token = hashedOtp;
    user.reset_token_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    await this.usersService.save(user);

    // Try sending email via SendGrid API
    const sendGridApiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS || '';
    const sendGridFrom = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || 'no-reply@payroll.com';

    const mailOptions = {
      to: user.email,
      subject: 'Password Reset OTP - Payroll Management System',
      text: `Hello,\n\nYou requested a password reset. Please use the following One-Time Password (OTP) to complete the process:\n\n${otp}\n\nThis OTP is valid for 15 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nPayroll Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-top: 0;">Payroll Management System</h2>
          <p>Hello,</p>
          <p>You requested a password reset. Please use the following One-Time Password (OTP) to complete the process:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; color: #111827; margin: 20px 0; border: 1px solid #e5e7eb;">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>15 minutes</strong>. If you did not request this reset, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 11px; color: #6b7280; text-align: center;">This is an automated security message. Please do not reply.</p>
        </div>
      `,
    };

    try {
      await sendMail(
        {
          auth: sendGridApiKey ? { user: '', pass: sendGridApiKey } : undefined,
          from: sendGridFrom,
        },
        mailOptions,
      );
      console.log(`[Mailer success] OTP email sent successfully to ${user.email}`);
    } catch (err: any) {
      console.error(`[Mailer error] Failed to send OTP email to ${user.email}:`, err.message || err);
      throw new InternalServerErrorException('Failed to send OTP email. Please check SendGrid / Mailer configuration.');
    }

    return {
      message: 'Password reset OTP has been sent successfully.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Hash the incoming plain-text OTP input to compare it to the database SHA-256 hash
    const hashedOtp = crypto.createHash('sha256').update(resetPasswordDto.token).digest('hex');

    const user = await this.usersService.findByResetToken(hashedOtp);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token / OTP');
    }

    if (user.reset_token_expires && new Date() > user.reset_token_expires) {
      throw new BadRequestException('Invalid or expired reset token / OTP');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);
    user.password = hashedPassword;
    user.reset_token = null;
    user.reset_token_expires = null;

    await this.usersService.save(user);

    return {
      message: 'Password has been reset successfully.',
    };
  }
}
