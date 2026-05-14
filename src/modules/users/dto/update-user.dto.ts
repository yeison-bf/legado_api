// users/dto/update-user.dto.ts
import { IsString, IsEmail, IsOptional, MinLength, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  // Cambio de contraseña — requiere la actual para confirmar identidad
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  // Solo ADMIN
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  institutionId?: number;
}