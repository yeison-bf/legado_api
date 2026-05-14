// users.controller.ts
import { Controller, Get, Param, UseGuards, SetMetadata, Post, Body, Put, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  register(@Body() data: any) {
    return this.usersService.register(data);
  }

  // Endpoint público de login (sin autenticación)
  @Post('login')
  async login(@Body() loginDto: LoginDto) { // ← Usar LoginDto
    return this.usersService.login(loginDto.username, loginDto.password);
  }

  @Get('search')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async search(
    @Query('q') query: string,
    @Query('institutionId') institutionId: string,
    @GetUser() user: User
  ) {
    // Si se pasa un institutionId, lo usamos. Si no, usamos el del usuario actual si es ADMINISTRATOR o similar.
    const id = institutionId ? +institutionId : user.institution?.id;
    return this.usersService.search(query, id);
  }

  @Get('institution/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getInstitutionStats(@GetUser() user: User) {
    if (!user.institution) {
      return { totalAlumni: 0, withExperience: 0, multipleDegrees: 0, professionals: 0, levelDistribution: [] };
    }
    return this.usersService.getInstitutionStats(user.institution.id);
  }

  @Get('institution/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async listByInstitution(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('institutionId') institutionId: string,
    @GetUser() user: User
  ) {
    const id = institutionId ? +institutionId : user.institution?.id;
    if (!id) return { items: [], total: 0 };
    return this.usersService.findAllPaginated(id, +page, +limit);
  }

  @Put(':id/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async updateRole(
    @Param('id') id: string,
    @Body('roleName') roleName: string,
    @GetUser() currentUser: User
  ) {
    return this.usersService.updateRole(+id, roleName, currentUser);
  }

  // Los siguientes endpoints requieren autenticación
  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getProfile(@GetUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get('institution/:id')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  findByInstitution(@Param('id') id: string) {
    return this.usersService.findByInstitution(+id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findOne(@Param('id') id: string, @GetUser() currentUser: User) {
    return this.usersService.findOne(+id, currentUser);
  }


  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    return this.usersService.update(+id, dto, currentUser);
  }
}