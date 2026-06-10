import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  category: string; // e.g., 'rent', 'salary', 'utilities', 'marketing', 'one-time', 'other'

  @Column()
  frequency: string; // 'monthly', 'one-time'

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  startDate: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  endDate: string; // YYYY-MM-DD

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;
}
