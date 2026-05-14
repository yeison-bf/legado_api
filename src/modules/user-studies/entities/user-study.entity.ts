import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('user_studies')
export class UserStudy {
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre del estudio
  @Column()
  title: string;

  // Institución educativa
  @Column()
  institution: string;

  // Nivel educativo
  @Column({ nullable: true })
  level: string;
  // Técnico, Tecnólogo, Pregrado, Especialización, Maestría, Doctorado, Curso

  // Área o carrera
  @Column({ nullable: true })
  fieldOfStudy: string;
  // Ingeniería de Sistemas, Derecho, Marketing, etc.

  // Fecha de inicio
  @Column({ nullable: true, type: 'date' })
  startDate: Date;

  // Fecha de finalización
  @Column({ nullable: true, type: 'date' })
  completionDate: Date;

  // Estado del estudio
  @Column({
    nullable: true,
    default: 'En curso',
  })
  status: string;
  // En curso, Finalizado, Suspendido, Cancelado

  // Modalidad
  @Column({ nullable: true })
  modality: string;
  // Virtual, Presencial, Híbrido

  // País
  @Column({ nullable: true })
  country: string;

  // Ciudad
  @Column({ nullable: true })
  city: string;

  // URL certificado o diploma
  @Column({ nullable: true, type: 'text' })
  certificateUrl: string;

  // Descripción adicional
  @Column({ nullable: true, type: 'text' })
  description: string;


  // Relación con usuario
  @ManyToOne(() => User, (user) => user.studies, {
    onDelete: 'CASCADE',
  })
  user: User;
}