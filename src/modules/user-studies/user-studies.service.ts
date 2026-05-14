import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStudy } from './entities/user-study.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UserStudiesService {
  constructor(
    @InjectRepository(UserStudy)
    private readonly studyRepository: Repository<UserStudy>,
  ) {}

  async create(createDto: any, user: User) {
    const study = this.studyRepository.create({
      ...createDto,
      user,
    });
    return this.studyRepository.save(study);
  }

  async findAll(user: User) {
    return this.studyRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async update(id: number, updateDto: any, user: User) {
    const study = await this.studyRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!study) {
      throw new NotFoundException(`Study with ID ${id} not found`);
    }

    if (study.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own studies');
    }

    Object.assign(study, updateDto);
    return this.studyRepository.save(study);
  }

  async remove(id: number, user: User) {
    const study = await this.studyRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!study) {
      throw new NotFoundException(`Study with ID ${id} not found`);
    }

    if (study.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own studies');
    }

    return this.studyRepository.remove(study);
  }
}
