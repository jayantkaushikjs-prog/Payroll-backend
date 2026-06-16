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

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  monthly_ctc: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  annual_ctc: number;

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

  @Column({ default: false })
  pf_deduction: boolean;

  @Column({ default: true })
  tax_deduction: boolean;

  // HR Global Fields
  @Column({ type: 'date', nullable: true })
  relieving_date: string;

  @Column({ type: 'text', nullable: true })
  other_inputs: string;

  @Column({ type: 'int', default: 30 })
  no_of_days_present: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deduction_absent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  appraisal: number;

  @Column({ type: 'date', nullable: true })
  appraisal_effective_date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  leave_encashment: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  late_arrival_deduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  damages_recovery: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonus_incentives: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  other_deductions: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
