import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserExperience } from './entities/user-experience.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UserExperienceService {
  constructor(
    @InjectRepository(UserExperience)
    private readonly experienceRepository: Repository<UserExperience>,
  ) {}

  async create(createDto: any, user: User) {
    const experience = this.experienceRepository.create({
      ...createDto,
      user,
    });
    return this.experienceRepository.save(experience);
  }

  async findAll(user: User) {
    return this.experienceRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async update(id: number, updateDto: any, user: User) {
    const experience = await this.experienceRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!experience) {
      throw new NotFoundException(`Experience with ID ${id} not found`);
    }

    if (experience.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own experience');
    }

    Object.assign(experience, updateDto);
    return this.experienceRepository.save(experience);
  }

  async remove(id: number, user: User) {
    const experience = await this.experienceRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!experience) {
      throw new NotFoundException(`Experience with ID ${id} not found`);
    }

    if (experience.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own experience');
    }

    return this.experienceRepository.remove(experience);
  }
}
