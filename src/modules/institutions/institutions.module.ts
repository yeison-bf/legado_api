import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  controllers: [InstitutionsController],  // ← Agregar controllers
  providers: [InstitutionsService],       // ← Agregar providers
  exports: [InstitutionsService],         // ← Exportar el servicio (opcional, si otros módulos lo usan)
})
export class InstitutionsModule {}