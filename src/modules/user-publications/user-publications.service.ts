import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPublication } from './entities/user-publication.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UserPublicationsService {
  constructor(
    @InjectRepository(UserPublication)
    private readonly publicationRepository: Repository<UserPublication>,
  ) {}

  async create(createDto: any, user: User) {
    const publication = this.publicationRepository.create({
      ...createDto,
      user,
    });
    return this.publicationRepository.save(publication);
  }

  async findAll(user: User) {
    return this.publicationRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async update(id: number, updateDto: any, user: User) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    if (publication.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own publications');
    }

    Object.assign(publication, updateDto);
    return this.publicationRepository.save(publication);
  }

  async remove(id: number, user: User) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    if (publication.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own publications');
    }

    return this.publicationRepository.remove(publication);
  }
}
