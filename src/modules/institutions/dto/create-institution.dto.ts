import { IsString, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
