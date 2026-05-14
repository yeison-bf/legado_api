import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotionGroup } from './entities/promotion-group.entity';
import { PromotionMember } from './entities/promotion-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(PromotionGroup)
    private readonly groupRepository: Repository<PromotionGroup>,
    @InjectRepository(PromotionMember)
    private readonly memberRepository: Repository<PromotionMember>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

  async findOrCreateGroup(data: any, user: User) {
    const existingGroup = await this.groupRepository.findOne({
      where: {
        year: Number(data.year),
        programName: data.programName,
        groupName: data.groupName,
        institutionId: user.institution?.id,
      },
    });

    if (existingGroup) return existingGroup;

    const newGroup = this.groupRepository.create({
      year: Number(data.year),
      programName: data.programName,
      groupName: data.groupName,
      institutionId: user.institution?.id,
      createdBy: user,
    });
    
    return this.groupRepository.save(newGroup);
  }

  async joinGroup(groupId: number, user: User) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const existingMember = await this.memberRepository.findOne({
      where: { user: { id: user.id }, promotionGroup: { id: groupId } },
    });

    if (existingMember) return existingMember;

    const member = this.memberRepository.create({
      user,
      promotionGroup: group,
    });

    return this.memberRepository.save(member);
  }

  async getMyGroups(userId: number) {
    return this.memberRepository.find({
      where: { user: { id: userId } },
      relations: ['promotionGroup', 'promotionGroup.members', 'promotionGroup.members.user'],
    });
  }

  async getMessages(groupId: number, user: User) {
    // Verificar que el usuario pertenece al grupo
    const isMember = await this.memberRepository.findOne({
      where: { user: { id: user.id }, promotionGroup: { id: groupId } },
    });

    if (!isMember) throw new ConflictException('No perteneces a este grupo');

    return this.messageRepository.find({
      where: { promotionGroup: { id: groupId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      take: 100, // Últimos 100 mensajes
    });
  }

  async sendMessage(groupId: number, content: string, user: User) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const message = this.messageRepository.create({
      content,
      user,
      promotionGroup: group,
    });

    return this.messageRepository.save(message);
  }

  async searchGroups(query: any, institutionId: number) {
    const qb = this.groupRepository.createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .where('group.institutionId = :institutionId', { institutionId });

    if (query.year) qb.andWhere('group.year = :year', { year: query.year });
    if (query.programName) qb.andWhere('group.programName = :programName', { programName: query.programName });
    
    return qb.getMany();
  }
}
