import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBoardExamRegistrationDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  academicYearId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  symbolNo!: string;
}
