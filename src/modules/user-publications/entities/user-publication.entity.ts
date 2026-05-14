import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_publications')
export class UserPublication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  type: string; // Libro, Artículo, Producción

  @Column({ nullable: true })
  date: Date;

  @Column({ nullable: true })
  publisher: string;

  @Column({ nullable: true })
  link: string;

  @ManyToOne(() => User, (user) => user.publications, { onDelete: 'CASCADE' })
  user: User;
}
