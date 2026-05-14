// entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Institution } from '../../institutions/entities/institution.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserStudy } from '../../user-studies/entities/user-study.entity';
import { UserExperience } from '../../user-experience/entities/user-experience.entity';
import { UserPublication } from '../../user-publications/entities/user-publication.entity';
import { UserLanguage } from '../../user-languages/entities/user-language.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true }) // ← nullable true porque algunos usuarios podrían no venir del sistema externo
  externalId: number; // ID from the login API (iensmm)

  @Column({ unique: true, nullable: true }) // ← agregar username
  username: string;

  // entities/user.entity.ts — agrega este campo
  @Column({ nullable: true })
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) // ← agregar phone
  phone: string;

  @Column({ nullable: true }) // ← agregar address
  address: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ default: true }) // ← agregar isActive
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true }) // ← agregar lastLoginAt
  lastLoginAt: Date;

  @Column({ nullable: true }) // ← campo para el rol como string (por si acaso)
  roleName: string;

  @ManyToOne(() => Institution, (institution) => institution.users)
  institution: Institution;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @OneToMany(() => UserStudy, (study) => study.user)
  studies: UserStudy[];

  @OneToMany(() => UserExperience, (experience) => experience.user)
  experiences: UserExperience[];

  @OneToMany(() => UserPublication, (publication) => publication.user)
  publications: UserPublication[];

  @OneToMany(() => UserLanguage, (language) => language.user)
  languages: UserLanguage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}