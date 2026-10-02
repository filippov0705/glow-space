import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDTO {
  @IsString()
  @IsUUID()
  uuid!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  name!: string;
}
