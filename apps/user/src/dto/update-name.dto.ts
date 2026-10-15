import { NAME_MIN_LENGTH } from '@glow-space/shared';
import { IsString, MinLength } from 'class-validator';

export class UpdateNameDTO {
  @IsString()
  @MinLength(NAME_MIN_LENGTH)
  name!: string;
}
