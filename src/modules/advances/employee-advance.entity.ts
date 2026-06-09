import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('employee_advances')
export class EmployeeAdvance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // Total advance amount

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 20 })
  recovery_type: 'one_time' | 'installment';

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  installment_amount: number; // Null for one_time

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_recovered: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  remaining_amount: number;

  @Column({ type: 'int' })
  start_month: number;

  @Column({ type: 'int' })
  start_year: number;

  @Column({ default: false })
  is_fully_recovered: boolean;

  @CreateDateColumn()
  created_at: Date;
}
