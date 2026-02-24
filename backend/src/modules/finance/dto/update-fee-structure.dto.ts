import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { FeeType, Stream } from '@prisma/client';

export class UpdateFeeStructureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(FeeType)
  feeType?: FeeType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsInt()
  level?: number | null;

  @IsOptional()
  @IsEnum(Stream)
  stream?: Stream | null;
}
