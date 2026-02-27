import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9\-]+$/, {
    message: 'registrationNo must contain only digits and hyphens',
  })
  registrationNo!: string;

  @IsDateString()
  dob!: string;

  /** Bikram Sambat year component of DOB (e.g. 2063) */
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2090)
  dobBsYear?: number;

  /** Bikram Sambat month component of DOB (1-12) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  dobBsMonth?: number;

  /** Bikram Sambat day component of DOB (1-32) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32)
  dobBsDay?: number;

  @IsEnum(Gender)
  gender!: Gender;

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
}
