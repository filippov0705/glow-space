import { Injectable } from '@nestjs/common';
import { UserResponse } from '@glow-space/shared';
import { User } from '@prisma/client';

@Injectable()
class UserResponder {
  constructor() {}

  async getUserResponse(user: User): Promise<UserResponse> {
    return {
      uuid: user.uuid,
      email: user.email,
    };
  }
}

export default UserResponder;
