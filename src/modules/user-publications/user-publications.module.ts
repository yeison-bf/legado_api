import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPublication } from './entities/user-publication.entity';
import { UserPublicationsController } from './user-publications.controller';
import { UserPublicationsService } from './user-publications.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPublication])],
  controllers: [UserPublicationsController],
  providers: [UserPublicationsService],
})
export class UserPublicationsModule {}
