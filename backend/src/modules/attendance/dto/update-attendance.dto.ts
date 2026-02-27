import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class UpdateAttendanceRecordDto {
  @IsUUID()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttendanceRecordDto)
  records!: UpdateAttendanceRecordDto[];
}
