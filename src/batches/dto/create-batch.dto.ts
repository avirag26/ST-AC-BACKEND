import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  classGradeId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  tutorProfileId?: string;
}
