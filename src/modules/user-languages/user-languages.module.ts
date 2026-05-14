import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLanguage } from './entities/user-language.entity';
import { UserLanguagesController } from './user-languages.controller';
import { UserLanguagesService } from './user-languages.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserLanguage])],
  controllers: [UserLanguagesController],
  providers: [UserLanguagesService],
})
export class UserLanguagesModule {}
