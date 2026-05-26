import { Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProgramsService } from './programs.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('programs')
@UseGuards(AuthGuard('jwt'))
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll(@GetUser() user: User) {
    // Si es administrador, puede que quiera ver de su institución.
    // Si es egresado, ve de su institución.
    const institutionId = user.institution?.id;
    if (!institutionId) return [];
    return this.programsService.findAllByInstitution(institutionId);
  }

  @Post('sync')
  sync(@GetUser() user: User) {
    const institutionId = user.institution?.id;
    if (!institutionId) return { success: false, message: 'No institution associated' };
    return this.programsService.syncPrograms(institutionId);
  }
}
