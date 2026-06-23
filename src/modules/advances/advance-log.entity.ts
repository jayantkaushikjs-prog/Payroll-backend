import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('advance_logs')
export class AdvanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  borrowed_date: string;

  @Column({ type: 'date', nullable: true })
  tentative_return_date: string | null;

  @Column({ type: 'date', nullable: true })
  actual_return_date: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: 'open' | 'returned' | 'partially_returned';

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_returned: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
