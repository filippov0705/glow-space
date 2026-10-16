import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDTO {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
