import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  gradeId!: string;

  @IsUUID()
  academicYearId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rollNo?: number;
}
