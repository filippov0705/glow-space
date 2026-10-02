import { IsString } from 'class-validator';

export class GoogleLoginDTO {
  @IsString()
  code!: string;
}
