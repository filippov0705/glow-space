import { AuthService } from '../services/auth.service';
import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { LoginDTO } from '../dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() body: LoginDTO): Promise<void> {
    const user = await this.authService.validateUser(body);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
