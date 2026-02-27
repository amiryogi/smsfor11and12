import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBoardExamRegistrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  symbolNo?: string;
}
