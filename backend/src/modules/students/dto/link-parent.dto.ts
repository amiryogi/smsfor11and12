import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LinkParentDto {
  @IsUUID()
  parentId!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string; // FATHER, MOTHER, GUARDIAN
}
