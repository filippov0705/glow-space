import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
} from '@nestjs/common';
import UserService from '../services/user.service';
import {
  JwtAuthGuard,
  type JwtAuthGuardRequest,
} from '../guards/jwt-auth.guard';
import { UserResponse } from '@glow-space/shared';
import UserResponder from 'src/responders/user.responder';
import UserRepository from 'src/repository/user.repository';
import { RegisterDTO } from 'src/dto/register.dto';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userResponder: UserResponder,
    private readonly userRepository: UserRepository,
  ) {}

  @Get('/:uuid')
  @UseGuards(JwtAuthGuard)
  async getUser(@Req() req: JwtAuthGuardRequest): Promise<UserResponse> {
    const userUUID = req.user.sub;

    const user = await this.userRepository.getUser(userUUID);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userResponder.getUserResponse(user);
  }

  @Post('/register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() body: RegisterDTO): Promise<{ uuid: string }> {
    await this.userRepository.create({
      uuid: body.uuid,
      email: body.email,
      name: body.name,
    });

    return { uuid: body.uuid };
  }
}

export default UserController;
