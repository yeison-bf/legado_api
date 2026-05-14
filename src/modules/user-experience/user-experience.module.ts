import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserExperience } from './entities/user-experience.entity';
import { UserExperienceController } from './user-experience.controller';
import { UserExperienceService } from './user-experience.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserExperience])],
  controllers: [UserExperienceController],
  providers: [UserExperienceService],
})
export class UserExperienceModule {}
