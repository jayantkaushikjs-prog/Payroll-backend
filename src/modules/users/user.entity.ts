import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password?: string;

  @Column({ nullable: true, select: false })
  reset_token?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  reset_token_expires?: Date;

  @Column({
    type: 'varchar',
    length: 50,
  })
  role: Role;

  @CreateDateColumn()
  created_at: Date;
}
