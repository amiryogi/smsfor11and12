import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTermDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
