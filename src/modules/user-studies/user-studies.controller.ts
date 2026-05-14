import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserStudiesService } from './user-studies.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('User Studies')
@ApiBearerAuth()
@Controller('user-studies')
@UseGuards(AuthGuard('jwt'))
export class UserStudiesController {
  constructor(private readonly userStudiesService: UserStudiesService) {}

  @Post()
  create(@Body() createDto: any, @GetUser() user: User) {
    return this.userStudiesService.create(createDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.userStudiesService.findAll(user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any, @GetUser() user: User) {
    return this.userStudiesService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.userStudiesService.remove(+id, user);
  }
}
