// institutions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './entities/institution.entity';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto): Promise<Institution> {
    try {
      const institution = this.institutionRepository.create(createInstitutionDto);
      return await this.institutionRepository.save(institution);
    } catch (error) {
      throw new BadRequestException('Error creating institution: ' + error.message);
    }
  }

  async findAll(): Promise<Institution[]> {
    return await this.institutionRepository.find({
      relations: ['users'],
    });
  }

  async findOne(id: number): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }

    return institution;
  }

  async update(
    id: number,
    updateInstitutionDto: UpdateInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.findOne(id);

    try {
      Object.assign(institution, updateInstitutionDto);
      return await this.institutionRepository.save(institution);
    } catch (error) {
      throw new BadRequestException('Error updating institution: ' + error.message);
    }
  }

  async remove(id: number): Promise<void> {
    const institution = await this.findOne(id);
    
    try {
      await this.institutionRepository.remove(institution);
    } catch (error) {
      throw new BadRequestException('Error deleting institution: ' + error.message);
    }
  }

  async softDelete(id: number): Promise<void> {
    const result = await this.institutionRepository.softDelete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }
  }
}