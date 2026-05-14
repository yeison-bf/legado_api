import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_languages')
export class UserLanguage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  language: string;

  @Column()
  level: string; // A1, A2, B1, B2, C1, C2

  @ManyToOne(() => User, (user) => user.languages, { onDelete: 'CASCADE' })
  user: User;
}
