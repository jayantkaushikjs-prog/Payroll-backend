import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('payrolls')
@Unique(['employee_id', 'month', 'year'])
export class Payroll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  gross_salary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  non_payable_deduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  pf_deduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  tax_deduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  advance_recovery: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  net_salary: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: 'draft' | 'locked' | 'disbursed';

  @Column({ type: 'json', nullable: true })
  recoveries_json: { advanceId: number; amount: number }[];

  @Column({ type: 'json', nullable: true })
  tax_breakdown_json: any;

  @CreateDateColumn()
  generated_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
