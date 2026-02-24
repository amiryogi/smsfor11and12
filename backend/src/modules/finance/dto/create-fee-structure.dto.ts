import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { FeeType, Stream } from '@prisma/client';

export class CreateFeeStructureDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(FeeType)
  feeType: FeeType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsInt()
  level?: number;

  @IsOptional()
  @IsEnum(Stream)
  stream?: Stream;
}
