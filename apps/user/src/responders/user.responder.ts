import { Injectable } from '@nestjs/common';
import {
  RegisterResponse,
  UserCityResponse,
  UserResponse,
} from '@glow-space/shared';
import { City, User } from 'src/generated/prisma';

@Injectable()
class UserResponder {
  constructor() {}

  getUserResponse(user: User): UserResponse {
    return {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
    };
  }

  userCityResponse(user: User, city: City): UserCityResponse {
    return {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      city: { slug: city.slug, name: city.name },
    };
  }

  registerResponse(user: User): RegisterResponse {
    return {
      uuid: user.uuid,
      email: user.email,
      name: user.name,
    };
  }
}

export default UserResponder;
