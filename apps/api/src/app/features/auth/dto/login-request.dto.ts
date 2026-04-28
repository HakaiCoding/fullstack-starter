import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

function trimStringValue({ value, obj, key }: TransformFnParams): unknown {
  const rawValue = (obj as Record<string, unknown>)[String(key)];
  if (typeof rawValue !== 'string') {
    return rawValue;
  }

  return typeof value === 'string' ? value.trim() : value;
}

export class LoginRequestDto {
  @Transform(trimStringValue)
  @IsString()
  @IsNotEmpty()
  email!: string;

  @Transform(trimStringValue)
  @IsString()
  @IsNotEmpty()
  password!: string;
}
