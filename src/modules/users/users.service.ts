import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { sendMail } from '../../common/utils/smtp-client';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Creating a new Super Admin user is not allowed');
    }

    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = await this.usersRepository.save(user);

    // Send credentials email to the newly created user
    const sendGridApiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS || '';
    const sendGridFrom = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || 'no-reply@payroll.com';

    const mailOptions = {
      to: saved.email,
      subject: 'Welcome to TH-PMS - Your Credentials',
      text: `Hello,\n\nYou have been added to TH-PMS.\n\nWebsite: http://localhost:5173\nRole: ${createUserDto.role}\nEmail: ${createUserDto.email}\nPassword: ${createUserDto.password}\n\nBest regards,\nTH-PMS Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
          <div style="margin-bottom: 10px;">
            <svg width="64" height="64" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" fill="#ffffff" rx="16" />
              <rect x="40" y="30" width="50" height="140" fill="#000000" rx="4" />
              <rect x="110" y="30" width="50" height="140" fill="#000000" rx="4" />
              <rect x="85" y="85" width="30" height="30" fill="#0ea5e9" transform="rotate(45 100 100)" />
            </svg>
          </div>
          <h2 style="color: #6366f1; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">TH-PMS</h2>
          <div style="text-align: left;">
            <p>Your account has been created successfully. Here are your details:</p>
            <p><strong>Website Link:</strong> <a href="http://localhost:5173" style="color: #6366f1;">http://localhost:5173</a></p>
            <p><strong>Role:</strong> ${createUserDto.role}</p>
            <p><strong>Email Address:</strong> ${createUserDto.email}</p>
            <p><strong>Password:</strong> ${createUserDto.password}</p>
          </div>
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
      console.log(`[New User Mail] Credentials email sent successfully to ${saved.email}`);
    } catch (err: any) {
      console.error(`[New User Mail Error] Failed to send credentials email to ${saved.email}:`, err.message || err);
    }

    delete saved.password;
    return saved;
  }

  async toggleBlockStatus(id: number, isBlocked: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Super Admin cannot be blocked or unblocked');
    }
    user.is_blocked = isBlocked;
    const saved = await this.usersRepository.save(user);
    delete saved.password;
    return saved;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.reset_token')
      .addSelect('user.reset_token_expires')
      .where('user.reset_token = :token', { token })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      order: { created_at: 'DESC' },
    });
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Super Admin user cannot be deleted');
    }
    await this.usersRepository.delete(id);
  }
}
