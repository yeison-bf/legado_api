import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import axios from 'axios';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);
  private readonly EXTERNAL_API_URL = 'https://edunormas-994aab16bf3d.herokuapp.com/programs';

  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async syncPrograms(institutionId: number) {
    try {
      this.logger.log(`Syncing programs for institution ${institutionId}...`);
      const response = await axios.get(`${this.EXTERNAL_API_URL}?institutionId=${institutionId}`);
      
      if (response.data && response.data.success) {
        const externalPrograms = response.data.data;

        for (const extProg of externalPrograms) {
          let program = await this.programRepository.findOne({
            where: { externalId: extProg.id, institutionId },
          });

          if (program) {
            program.name = extProg.name;
            program.description = extProg.description;
            program.status = extProg.status;
          } else {
            program = this.programRepository.create({
              externalId: extProg.id,
              name: extProg.name,
              description: extProg.description,
              status: extProg.status,
              institutionId,
            });
          }
          await this.programRepository.save(program);
        }
        return { success: true, count: externalPrograms.length };
      }
      return { success: false, message: 'External API error' };
    } catch (error) {
      this.logger.error(`Error syncing programs: ${error.message}`);
      throw error;
    }
  }

  async findAllByInstitution(institutionId: number) {
    // Intentamos sincronizar cada vez que se listan, o podríamos tener un botón de "Sincronizar"
    // Por ahora lo hacemos bajo demanda si la tabla está vacía o simplemente devolvemos lo que hay
    const programs = await this.programRepository.find({
      where: { institutionId, status: true },
    });

    if (programs.length === 0) {
      await this.syncPrograms(institutionId);
      return this.programRepository.find({
        where: { institutionId, status: true },
      });
    }

    return programs;
  }
}
