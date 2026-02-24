import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  feeStructureIds: string[];

  @IsString()
  @IsNotEmpty()
  dueDate: string;
}
