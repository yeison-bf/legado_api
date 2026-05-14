import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserExperienceService } from './user-experience.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('User Experience')
@ApiBearerAuth()
@Controller('user-experience')
@UseGuards(AuthGuard('jwt'))
export class UserExperienceController {
  constructor(private readonly userExperienceService: UserExperienceService) {}

  @Post()
  create(@Body() createDto: any, @GetUser() user: User) {
    return this.userExperienceService.create(createDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.userExperienceService.findAll(user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any, @GetUser() user: User) {
    return this.userExperienceService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.userExperienceService.remove(+id, user);
  }
}
