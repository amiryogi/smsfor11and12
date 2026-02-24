import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Stream } from '@prisma/client';

export class CreateGradeDto {
  @IsInt()
  @Min(11)
  @Max(12)
  level!: number;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsEnum(Stream)
  stream!: Stream;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
