import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('non_payable_days')
@Unique(['employee_id', 'month', 'year'])
export class NonPayableDays {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  days: number;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;
}
