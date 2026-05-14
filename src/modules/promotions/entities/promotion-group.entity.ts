import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Institution } from '../../institutions/entities/institution.entity';
import { User } from '../../users/entities/user.entity';
import { PromotionMember } from './promotion-member.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('promotion_groups')
export class PromotionGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column()
  programName: string;

  @Column()
  groupName: string; // Ej: "11-A"

  @ManyToOne(() => Institution)
  institution: Institution;

  @Column()
  institutionId: number;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PromotionMember, (member) => member.promotionGroup)
  members: PromotionMember[];

  @OneToMany(() => ChatMessage, (message) => message.promotionGroup)
  messages: ChatMessage[];
}
