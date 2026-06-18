import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('hr_preview_reviews')
export class HrPreviewReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  month: string;

  @Column({ default: 'undone' })
  status: 'done' | 'undone';

  @Column({ type: 'text', nullable: true })
  finance_remarks: string;

  @Column({ type: 'json', nullable: true })
  logs: Array<{
    action: string;
    from?: string;
    to?: string;
    remarks?: string;
    email?: string;
    created_at: string;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  hr_marked_done_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  hr_marked_undone_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
