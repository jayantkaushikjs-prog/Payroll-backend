import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blacklisted_tokens')
export class BlacklistedToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'text' })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
