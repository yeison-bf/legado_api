import { Controller, Get, Post, Body, Query, UseGuards, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PromotionsService } from './promotions.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('promotions')
@UseGuards(AuthGuard('jwt'))
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('search')
  search(@Query() query: any, @GetUser() user: User) {
    return this.promotionsService.searchGroups(query, user.institution?.id);
  }

  @Post('join')
  joinOrCreate(@Body() data: any, @GetUser() user: User) {
    return this.promotionsService.findOrCreateGroup(data, user)
      .then(group => this.promotionsService.joinGroup(group.id, user));
  }

  @Get('my-groups')
  getMyGroups(@GetUser() user: User) {
    return this.promotionsService.getMyGroups(user.id);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @GetUser() user: User) {
    return this.promotionsService.getMessages(+id, user);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body('content') content: string, @GetUser() user: User) {
    return this.promotionsService.sendMessage(+id, content, user);
  }

  @Delete(':id/leave')
  leaveGroup(@Param('id') id: string, @GetUser() user: User) {
    return this.promotionsService.leaveGroup(+id, user.id);
  }
}
