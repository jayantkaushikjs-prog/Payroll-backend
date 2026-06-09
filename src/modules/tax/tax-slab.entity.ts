import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tax_slabs')
export class TaxSlab {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  financial_year: string; // e.g. "2026-2027"

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  from_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  to_amount: number; // NULL represents "And above"

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number; // e.g. 5.00, 10.00 %

  @Column({ default: 'new' })
  regime: string;

  @CreateDateColumn()
  created_at: Date;
}
