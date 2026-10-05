import { Injectable } from '@nestjs/common';
import { RegisterResponse, UserResponse } from '@glow-space/shared';
import { User } from 'src/generated/prisma';

@Injectable()
class UserResponder {
  constructor() {}

  async getUserResponse(user: User): Promise<UserResponse> {
    return {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
    };
  }

  async registerResponse(user: User): Promise<RegisterResponse> {
    return {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
    };
  }
}

export default UserResponder;
