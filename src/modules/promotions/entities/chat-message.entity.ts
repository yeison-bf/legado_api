import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PromotionGroup } from './promotion-group.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => PromotionGroup, (group) => group.messages)
  promotionGroup: PromotionGroup;

  @CreateDateColumn()
  createdAt: Date;
}
