import { IsNotEmpty, IsString } from 'class-validator';

export class CityQueryDTO {
  @IsString()
  @IsNotEmpty()
  city!: string;
}
