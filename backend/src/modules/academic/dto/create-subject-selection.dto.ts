import { IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class CreateSubjectSelectionDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  academicYearId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  gradeSubjectIds!: string[];
}
