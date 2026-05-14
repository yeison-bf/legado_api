import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserLanguagesService } from './user-languages.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('User Languages')
@ApiBearerAuth()
@Controller('user-languages')
@UseGuards(AuthGuard('jwt'))
export class UserLanguagesController {
  constructor(private readonly userLanguagesService: UserLanguagesService) {}

  @Post()
  create(@Body() createDto: any, @GetUser() user: User) {
    return this.userLanguagesService.create(createDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.userLanguagesService.findAll(user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any, @GetUser() user: User) {
    return this.userLanguagesService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.userLanguagesService.remove(+id, user);
  }
}
