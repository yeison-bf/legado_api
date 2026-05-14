import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserPublicationsService } from './user-publications.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('User Publications')
@ApiBearerAuth()
@Controller('user-publications')
@UseGuards(AuthGuard('jwt'))
export class UserPublicationsController {
  constructor(private readonly userPublicationsService: UserPublicationsService) {}

  @Post()
  create(@Body() createDto: any, @GetUser() user: User) {
    return this.userPublicationsService.create(createDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.userPublicationsService.findAll(user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any, @GetUser() user: User) {
    return this.userPublicationsService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.userPublicationsService.remove(+id, user);
  }
}
