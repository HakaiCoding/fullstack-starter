import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

function trimStringValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class LoginRequestDto {
  @Transform(({ value }) => trimStringValue(value))
  @IsString()
  @IsNotEmpty()
  email!: string;

  @Transform(({ value }) => trimStringValue(value))
  @IsString()
  @IsNotEmpty()
  password!: string;
}
