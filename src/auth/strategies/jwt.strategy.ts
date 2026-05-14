import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Institution } from '../../modules/institutions/entities/institution.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { userId, firstName, lastName, email, role, headquarters } = payload;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Try to find user locally by id or externalId
    let user = await this.userRepository.findOne({
      where: [
        { id: userId },
        { externalId: userId }
      ],
      relations: ['role', 'institution'],
    });

    if (!user) {
      // User doesn't exist locally, create them
      
      // 1. Ensure Role exists
      let localRole = await this.roleRepository.findOne({ where: { name: role } });
      if (!localRole) {
        localRole = this.roleRepository.create({ name: role });
        localRole = await this.roleRepository.save(localRole);
      }

      // 2. Ensure Institution exists
      // Assuming headquarters contains institution info
      const institutionData = headquarters?.[0]?.institution;
      let localInstitution = null;
      if (institutionData) {
        localInstitution = await this.institutionRepository.findOne({
          where: { id: institutionData.id },
        });
        if (!localInstitution) {
          localInstitution = this.institutionRepository.create({
            id: institutionData.id,
            name: institutionData.name,
            logoUrl: institutionData.logoUrl,
          });
          localInstitution = await this.institutionRepository.save(localInstitution);
        }
      }

      // 3. Create User
      user = this.userRepository.create({
        externalId: userId,
        firstName,
        lastName,
        email: email || `${payload.username}@legado.local`, // Fallback if email is missing
        photoUrl: payload.photoUrl,
        role: localRole,
        institution: localInstitution,
      });

      user = await this.userRepository.save(user);
    }

    return user;
  }
}
