import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Gender, StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2090)
  dobBsYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  dobBsMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32)
  dobBsDay?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  citizenshipNo?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
