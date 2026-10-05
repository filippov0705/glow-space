import { Injectable } from '@nestjs/common';
import { GoogleAuthResponse } from '@glow-space/shared';
import { User } from 'src/generated/prisma';

@Injectable()
class UserResponder {
  googleAuthResponse(user: User, isNewUser: boolean): GoogleAuthResponse {
    return {
      is_new_user: isNewUser,
      user: {
        uuid: user.uuid,
        status: user.status,
        email: user.email,
        name: user.name,
      },
    };
  }
}

export default UserResponder;
