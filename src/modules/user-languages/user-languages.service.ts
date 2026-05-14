import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLanguage } from './entities/user-language.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UserLanguagesService {
  constructor(
    @InjectRepository(UserLanguage)
    private readonly languageRepository: Repository<UserLanguage>,
  ) {}

  async create(createDto: any, user: User) {
    const language = this.languageRepository.create({
      ...createDto,
      user,
    });
    return this.languageRepository.save(language);
  }

  async findAll(user: User) {
    return this.languageRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async update(id: number, updateDto: any, user: User) {
    const language = await this.languageRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!language) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }

    if (language.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own languages');
    }

    Object.assign(language, updateDto);
    return this.languageRepository.save(language);
  }

  async remove(id: number, user: User) {
    const language = await this.languageRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!language) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }

    if (language.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own languages');
    }

    return this.languageRepository.remove(language);
  }
}
