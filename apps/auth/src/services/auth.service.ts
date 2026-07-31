import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LoginDTO } from 'src/dto/login.dto';
import UserRepository from 'src/repository/user.repository';
import * as bcrypt from 'bcrypt';
import { hashString } from 'src/utils/hashString';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async validateUser(
    body: LoginDTO,
  ): Promise<{ uuid: string; role: Role } | null> {
    const user = await this.userRepository.findByEmail(body.email);

    if (!user) return null;

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) return null;

    return { uuid: user.uuid, role: user.role };
  }
}
