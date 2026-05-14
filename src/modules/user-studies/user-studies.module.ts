import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStudy } from './entities/user-study.entity';
import { UserStudiesController } from './user-studies.controller';
import { UserStudiesService } from './user-studies.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserStudy])],
  controllers: [UserStudiesController],
  providers: [UserStudiesService],
})
export class UserStudiesModule {}
