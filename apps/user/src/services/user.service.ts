import { Injectable } from '@nestjs/common';
import UserRepository from '../repository/user.repository';
import { RegisterDTO } from 'src/dto/register.dto';

@Injectable()
class UserService {
  constructor(private readonly userRepository: UserRepository) {}
}

export default UserService;
