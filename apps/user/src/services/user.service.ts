import { Injectable } from '@nestjs/common';
import UserRepository from '../repository/user.repository';

@Injectable()
class UserService {
  constructor(private readonly userRepository: UserRepository) {}
}

export default UserService;
