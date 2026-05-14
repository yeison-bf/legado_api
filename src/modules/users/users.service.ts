// users.service.ts
import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { RolesService } from '../roles/roles.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly EXTERNAL_API_URL = 'https://edunormas-994aab16bf3d.herokuapp.com/users/login';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly roleService: RolesService,
  ) {}

  // ============================================
  // LOGIN PRINCIPAL
  // ============================================
  async login(username: string, password: string) {
    // 1. Buscar usuario en BD local
    const localUser = await this.userRepository.findOne({
      where: { username },
      relations: ['institution', 'role'],
    });

    if (localUser) {
      // 2a. Existe en BD → verificar contraseña local
      const isValidLocal = localUser.passwordHash
        ? await bcrypt.compare(password, localUser.passwordHash)
        : false;

      if (isValidLocal) {
        // ✅ Contraseña correcta → login directo sin tocar API externa
        localUser.lastLoginAt = new Date();
        await this.userRepository.save(localUser);
        return this.buildResponse(localUser);
      }

      // 2b. Contraseña incorrecta en BD → puede haber cambiado en sistema externo
      // Intentar validar contra API externa
      try {
        const externalUser = await this.authenticateWithExternalApi(username, password);

        // API externa válida → actualizar hash con nueva contraseña
        localUser.passwordHash = await bcrypt.hash(password, 10);
        localUser.firstName = externalUser.firstName;
        localUser.lastName = externalUser.lastName;
        localUser.email = externalUser.email;
        localUser.phone = externalUser.phone || null;
        localUser.address = externalUser.address || null;
        localUser.photoUrl = externalUser.photoUrl || null;
        localUser.lastLoginAt = new Date();
        localUser.isActive = true;

        await this.userRepository.save(localUser);
        return this.buildResponse(localUser);

      } catch (externalError) {
        // API externa también falló → credenciales incorrectas
        throw new UnauthorizedException('Credenciales inválidas');
      }
    }

    // 3. No existe en BD local → consultar API externa
    let externalUser: any;
    try {
      externalUser = await this.authenticateWithExternalApi(username, password);
    } catch (error) {
      // API externa caída y usuario no existe localmente
      if (
        error instanceof HttpException &&
        (error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE ||
          error.getStatus() === HttpStatus.GATEWAY_TIMEOUT)
      ) {
        throw new HttpException(
          'Usuario no encontrado localmente y el servidor externo no está disponible. Intenta más tarde.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error; // UnauthorizedException u otros errores
    }

    // 4. Crear usuario en BD local con hash de contraseña
    const institution = await this.syncInstitution(externalUser);
    const newUser = await this.syncUser(externalUser, institution, password);

    return this.buildResponse(newUser);
  }

  // ============================================
  // REGISTRO MANUAL (PARA USUARIOS NO API EXTERNA)
  // ============================================
  async register(data: any) {
    // 1. Verificar si ya existe
    const existing = await this.userRepository.findOne({
      where: [{ username: data.username }, { email: data.email }]
    });

    if (existing) {
      throw new HttpException('El usuario o email ya se encuentra registrado', HttpStatus.CONFLICT);
    }

    // 2. Obtener rol GRADUATE
    const roles = await this.roleService.findAll();
    const graduateRole = roles.find((r) => r.name === 'GRADUATE');
    if (!graduateRole) throw new NotFoundException('Role GRADUATE not found');

    // 3. Obtener institución
    const institution = await this.institutionRepository.findOne({
      where: { id: data.institutionId }
    });
    if (!institution) throw new NotFoundException('Institución no encontrada');

    // 4. Crear usuario
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: graduateRole,
      institution,
      isActive: true,
      roleName: 'GRADUATE', // Compatibilidad con lógica existente
    });

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Usuario registrado correctamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  // ============================================
  // RESPUESTA ESTANDARIZADA
  // ============================================
  private buildResponse(user: User) {
    const token = this.generateToken(user);
    return {
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.roleName,
        roleLegado: user.role,
        institutionId: user.institution?.id,
        institutionName: user.institution?.name,
      },
    };
  }

  // ============================================
  // API EXTERNA
  // ============================================
  private async authenticateWithExternalApi(username: string, password: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          this.EXTERNAL_API_URL,
          { username, password },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          },
        ),
      );

      if (!response?.data.success) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const token = response?.data.token;
      const tokenPayload = this.decodeJwt(token);

      return { ...tokenPayload, externalToken: token };

    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          'No se pudo conectar al servidor externo.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new HttpException(
          'Tiempo de espera agotado al conectar con el servidor externo.',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      if (error.response?.status === 401) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      throw new HttpException(
        `Error al comunicarse con el servidor externo: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ============================================
  // SINCRONIZAR INSTITUCIÓN
  // ============================================
  private async syncInstitution(externalUser: any): Promise<Institution | null> {
    if (!externalUser.headquarters?.[0]?.institution) return null;

    const externalInstitution = externalUser.headquarters[0].institution;

    let institution = await this.institutionRepository.findOne({
      where: { id: externalInstitution.id },
    });

    if (!institution) {
      institution = this.institutionRepository.create({
        id: externalInstitution.id,
        name: externalInstitution.name,
        address: externalInstitution.address,
        isActive: true,
      });
      await this.institutionRepository.save(institution);
    }

    return institution;
  }

  // ============================================
  // SINCRONIZAR USUARIO — ahora recibe password
  // ============================================
  private async syncUser(
    externalUser: any,
    institution: Institution | null,
    password?: string,
  ): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { externalId: externalUser.userId },
      relations: ['institution', 'role'],
    });

    const roles = await this.roleService.findAll();
    const graduateRole = roles.find((r) => r.name === 'GRADUATE');
    if (!graduateRole) throw new Error('Role GRADUATE not found');

    // Hash de contraseña si viene
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    if (user) {
      user.username = externalUser.username;
      user.firstName = externalUser.firstName;
      user.lastName = externalUser.lastName;
      user.email = externalUser.email;
      user.phone = externalUser.phone || null;
      user.address = externalUser.address || null;
      user.photoUrl = externalUser.photoUrl || null;
      user.roleName = externalUser.role;
      user.role = graduateRole;
      user.institution = institution;
      user.lastLoginAt = new Date();
      user.isActive = true;
      if (passwordHash) user.passwordHash = passwordHash;

      await this.userRepository.save(user);
    } else {
      user = this.userRepository.create({
        externalId: externalUser.userId,
        username: externalUser.username,
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        email: externalUser.email,
        phone: externalUser.phone || null,
        address: externalUser.address || null,
        photoUrl: externalUser.photoUrl || null,
        roleName: externalUser.role,
        role: graduateRole,
        institution,
        isActive: true,
        lastLoginAt: new Date(),
        passwordHash,
      });

      await this.userRepository.save(user);
    }

    return user;
  }

  // ============================================
  // HELPERS
  // ============================================
  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(jsonPayload);
    } catch {
      throw new HttpException('Error al decodificar token', HttpStatus.BAD_REQUEST);
    }
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.roleName,
      roleLegado: user.role,
      institutionId: user.institution?.id,
    };
    return this.jwtService.sign(payload);
  }

  // ============================================
  // MÉTODOS EXISTENTES SIN CAMBIOS
  // ============================================
  async findOne(id: number, currentUser: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'institution', 'studies', 'experiences', 'publications', 'languages'],
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (currentUser.role?.name?.toUpperCase() === 'STUDENT' && currentUser.id !== user.id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    if (
      (currentUser.role?.name?.toUpperCase() === 'ADMIN' || currentUser.role?.name?.toUpperCase() === 'ADMINISTRATOR') &&
      currentUser.institution?.id !== user.institution?.id
    ) {
      throw new ForbiddenException('You can only access students from your institution');
    }

    return user;
  }

  async findByInstitution(institutionId: number) {
    return this.userRepository.find({
      where: { institution: { id: institutionId } },
      relations: ['role'],
    });
  }

  async findAllPaginated(institutionId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.userRepository.findAndCount({
      where: { institution: { id: institutionId } },
      relations: ['role'],
      skip,
      take: limit,
      order: { firstName: 'ASC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRole(userId: number, roleName: string, currentUser: User) {
    // Solo ADMIN puede cambiar roles
    const currentRole = currentUser.role?.name?.toUpperCase();
    if (currentRole !== 'ADMIN' && currentRole !== 'ADMINISTRATOR') {
      throw new ForbiddenException('Solo administradores pueden cambiar roles');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['institution', 'role'],
    });

    if (!user) throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);

    if (user.institution?.id !== currentUser.institution?.id) {
      throw new ForbiddenException('Solo puedes editar usuarios de tu propia institución');
    }

    const role = await this.roleService.findByName(roleName);
    if (!role) throw new NotFoundException(`Rol ${roleName} no encontrado`);

    user.role = role;
    return this.userRepository.save(user);
  }

  async search(query: string, institutionId?: number) {
    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.institution', 'institution')
      .where('(user.firstName LIKE :query OR user.lastName LIKE :query OR user.email LIKE :query OR user.username LIKE :query)', { query: `%${query}%` });

    if (institutionId) {
      qb.andWhere('institution.id = :institutionId', { institutionId });
    }

    return qb.getMany();
  }

  async getInstitutionStats(institutionId: number) {
    const totalAlumni = await this.userRepository.count({
      where: { institution: { id: institutionId } },
    });

    const alumniWithExperience = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.experiences', 'experience')
      .where('user.institutionId = :institutionId', { institutionId })
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne();

    const alumniWithMultipleDegrees = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.studies', 'study')
      .where('user.institutionId = :institutionId', { institutionId })
      .andWhere('study.level = :level', { level: 'Pregrado' })
      .groupBy('user.id')
      .having('COUNT(study.id) > 1')
      .select('user.id')
      .getRawMany();

    const levelStats = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.studies', 'study')
      .where('user.institutionId = :institutionId', { institutionId })
      .select('study.level', 'level')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .groupBy('study.level')
      .getRawMany();

    // Profesionales (con al menos un pregrado finalizado)
    const professionals = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.studies', 'study')
      .where('user.institutionId = :institutionId', { institutionId })
      .andWhere('study.level IN (:...levels)', { levels: ['Pregrado', 'Especialización', 'Maestría', 'Doctorado'] })
      .andWhere('study.status = :status', { status: 'Finalizado' })
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne();

    // Empleados actualmente (endDate es NULL en alguna experiencia)
    const currentlyWorking = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.experiences', 'experience')
      .where('user.institutionId = :institutionId', { institutionId })
      .andWhere('experience.endDate IS NULL')
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne();

    // Políglotas (hablan 2 o más idiomas)
    const polyglots = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.languages', 'language')
      .where('user.institutionId = :institutionId', { institutionId })
      .groupBy('user.id')
      .having('COUNT(language.id) >= 2')
      .select('user.id')
      .getRawMany();

    // Distribución de idiomas
    const languageStats = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.languages', 'language')
      .where('user.institutionId = :institutionId', { institutionId })
      .select('language.language', 'language')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .groupBy('language.language')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      totalAlumni,
      withExperience: parseInt(alumniWithExperience.count),
      multipleDegrees: alumniWithMultipleDegrees.length,
      professionals: parseInt(professionals.count),
      currentlyWorking: parseInt(currentlyWorking.count),
      polyglots: polyglots.length,
      levelDistribution: levelStats.map(s => ({ level: s.level, count: parseInt(s.count) })),
      languageDistribution: languageStats.map(s => ({ language: s.language, count: parseInt(s.count) })),
    };
  }

  async getProfile(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'institution', 'studies', 'experiences', 'publications', 'languages'],
    });
  }



  // Agregar en users.service.ts

async update(targetId: number, dto: UpdateUserDto, currentUser: User): Promise<object> {
  // Solo el propio usuario puede editarse — ADMIN puede editar a cualquiera
  const currentRole = currentUser.role?.name?.toUpperCase();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'ADMINISTRATOR';

  if (!isAdmin && currentUser.id !== targetId) {
    throw new ForbiddenException('Solo puedes editar tu propio perfil');
  }

  const user = await this.userRepository.findOne({
    where: { id: targetId },
    relations: ['role', 'institution'],
  });

  if (!user) throw new NotFoundException(`Usuario con ID ${targetId} no encontrado`);

  // ── Datos personales ──────────────────────────────────────────
  if (dto.firstName !== undefined) user.firstName = dto.firstName;
  if (dto.lastName  !== undefined) user.lastName  = dto.lastName;
  if (dto.phone     !== undefined) user.phone     = dto.phone;
  if (dto.address   !== undefined) user.address   = dto.address;
  if (dto.photoUrl  !== undefined) user.photoUrl  = dto.photoUrl;

  // Email: verificar que no esté en uso por otro usuario
  if (dto.email !== undefined && dto.email !== user.email) {
    const emailTaken = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (emailTaken) {
      throw new HttpException('El email ya está en uso', HttpStatus.CONFLICT);
    }
    user.email = dto.email;
  }

  // ── Cambio de contraseña ──────────────────────────────────────
  if (dto.newPassword) {
    if (!dto.currentPassword) {
      throw new HttpException(
        'Debes proveer la contraseña actual para cambiarla',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValidCurrent = user.passwordHash
      ? await bcrypt.compare(dto.currentPassword, user.passwordHash)
      : false;

    if (!isValidCurrent) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
  }

  // ── Solo ADMIN: cambiar rol e institución ─────────────────────
  if (isAdmin) {
    if (dto.roleId !== undefined) {
      const role = await this.roleService.findOne(dto.roleId);
      if (!role) throw new NotFoundException(`Rol con ID ${dto.roleId} no encontrado`);
      user.role = role;
    }

    if (dto.institutionId !== undefined) {
      const institution = await this.institutionRepository.findOne({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new NotFoundException(`Institución con ID ${dto.institutionId} no encontrada`);
      }
      user.institution = institution;
    }
  }

  await this.userRepository.save(user);

  return {
    success: true,
    message: 'Perfil actualizado correctamente',
    user: {
      id:              user.id,
      username:        user.username,
      firstName:       user.firstName,
      lastName:        user.lastName,
      email:           user.email,
      phone:           user.phone,
      address:         user.address,
      photoUrl:        user.photoUrl,
      role:            user.role?.name,
      institutionId:   user.institution?.id,
      institutionName: user.institution?.name,
    },
  };
}
}