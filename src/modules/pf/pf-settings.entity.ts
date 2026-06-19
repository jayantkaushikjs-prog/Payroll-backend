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

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  esi_contribution_rate: number; // e.g. 0.75 % (Employer ESI rate)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.75 })
  esi_employee_contribution_rate: number; // e.g. 0.75 % (Employee ESI rate)

  @Column({ type: 'int', default: 2 })
  pf_contribution_type: number; // 1 = employer contribution, 2 = employee contribution

  @Column({ type: 'int', default: 2 })
  esi_contribution_type: number; // 1 = employer contribution, 2 = employee contribution

  @Column({ type: 'date', unique: true })
  effective_date: string; // ISO date string YYYY-MM-DD

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 200.00 })
  professional_tax: number;

  @CreateDateColumn()
  created_at: Date;
}
