import { IsOptional, IsUUID } from 'class-validator';

export class AssignGradeSubjectDto {
  @IsUUID()
  subjectId!: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

export class UpdateGradeSubjectDto {
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
