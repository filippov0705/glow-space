import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  Post,
  Patch,
  Body,
} from '@nestjs/common';
import UserService from '../services/user.service';
import {
  JwtAuthGuard,
  type JwtAuthGuardRequest,
} from '../guards/jwt-auth.guard';
import { UserCityResponse, UserResponse } from '@glow-space/shared';
import UserResponder from 'src/responders/user.responder';
import UserRepository from 'src/repository/user.repository';
import { RegisterDTO } from 'src/dto/register.dto';
import { UpdateNameDTO } from 'src/dto/update-name.dto';
import { UpdateCityDTO } from 'src/dto/update-city.dto';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userResponder: UserResponder,
    private readonly userRepository: UserRepository,
  ) {}

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateName(
    @Req() req: JwtAuthGuardRequest,
    @Body() body: UpdateNameDTO,
  ): Promise<UserResponse> {
    const user = await this.userService.updateName(req.user.sub, body.name);

    return this.userResponder.getUserResponse(user);
  }

  @Patch('/me/city')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateCity(
    @Req() req: JwtAuthGuardRequest,
    @Body() body: UpdateCityDTO,
  ): Promise<UserCityResponse> {
    const { user, city } = await this.userService.updateCity(
      req.user.sub,
      body.citySlug,
    );

    return this.userResponder.userCityResponse(user, city);
  }

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
    const user = await this.userRepository.create({
      uuid: body.uuid,
      email: body.email,
      name: body.name,
    });

    return this.userResponder.registerResponse(user);
  }
}

export default UserController;
