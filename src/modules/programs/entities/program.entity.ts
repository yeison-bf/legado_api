import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Institution } from '../../institutions/entities/institution.entity';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  externalId: number; // El ID que viene de edunormas

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  status: boolean;

  @Column()
  institutionId: number;

  @ManyToOne(() => Institution)
  institution: Institution;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
