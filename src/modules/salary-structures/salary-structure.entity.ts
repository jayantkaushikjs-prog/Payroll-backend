import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('salary_structures')
export class SalaryStructure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basic_salary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  hra: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  special_allowance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  other_allowance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  gross_salary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ctc: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'date' })
  effective_from: string;

  @CreateDateColumn()
  created_at: Date;
}
