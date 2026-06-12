import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pf_settings')
export class PFSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  employee_contribution_rate: number; // e.g. 12.00 %

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  employer_contribution_rate: number; // e.g. 12.00 %

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1800.00 })
  max_pf_cap: number; // e.g. 1800.00

  @Column({ type: 'date', unique: true })
  effective_date: string; // ISO date string YYYY-MM-DD

  @CreateDateColumn()
  created_at: Date;
}
