// src/roles/roles.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      // Verificar si el rol ya existe
      const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name.toUpperCase() },
      });

      if (existingRole) {
        throw new ConflictException(`Role ${createRoleDto.name} already exists`);
      }

      const role = this.roleRepository.create({
        name: createRoleDto.name.toUpperCase(),
      });
      
      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error creating role: ' + error.message);
    }
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['users'],
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { name: name.toUpperCase() },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name) {
      // Verificar si el nuevo nombre ya existe
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name.toUpperCase() },
      });

      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(`Role ${updateRoleDto.name} already exists`);
      }
      
      role.name = updateRoleDto.name.toUpperCase();
    }

    try {
      return await this.roleRepository.save(role);
    } catch (error) {
      throw new BadRequestException('Error updating role: ' + error.message);
    }
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    
    // Verificar si el rol tiene usuarios asociados
    if (role.users && role.users.length > 0) {
      throw new BadRequestException(
        `Cannot delete role ${role.name} because it has ${role.users.length} users associated`,
      );
    }

    try {
      await this.roleRepository.remove(role);
    } catch (error) {
      throw new BadRequestException('Error deleting role: ' + error.message);
    }
  }

  // Método para crear roles por defecto al iniciar la aplicación
  async seedDefaultRoles(): Promise<void> {
    const defaultRoles = ['ADMIN', 'STUDENT', 'TEACHER'];
    
    for (const roleName of defaultRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleName },
      });
      
      if (!existingRole) {
        const role = this.roleRepository.create({ name: roleName });
        await this.roleRepository.save(role);
        console.log(`Role ${roleName} created`);
      }
    }
  }
}