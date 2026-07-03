import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('monthly_employee_inputs')
@Unique(['employee_id', 'month'])
export class MonthlyEmployeeInput {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @Column({ length: 7 }) // Format: 'YYYY-MM'
  month: string;

  @Column({ type: 'int', nullable: true, default: null })
  no_of_days_present: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  appraisal: number;

  @Column({ type: 'date', nullable: true })
  appraisal_effective_date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deduction_absent: number;

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

  @Column({ type: 'text', nullable: true })
  other_inputs: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
