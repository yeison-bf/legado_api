import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PromotionGroup } from './promotion-group.entity';

@Entity('promotion_members')
@Unique(['user', 'promotionGroup'])
export class PromotionMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => PromotionGroup, (group) => group.members)
  promotionGroup: PromotionGroup;

  @CreateDateColumn()
  joinedAt: Date;
}
