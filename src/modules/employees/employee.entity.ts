import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  employee_code: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  department: string;

  @Column()
  designation: string;

  @Column({ type: 'date' })
  joining_date: string;

  @Column()
  bank_name: string;

  @Column()
  account_number: string;

  @Column()
  ifsc: string;

  @Column({ default: 'new' })
  tax_regime: string;

  @Column({ default: true })
  active_status: boolean;

  @Column({ default: true })
  pf_deduction: boolean;

  @Column({ default: true })
  tax_deduction: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
