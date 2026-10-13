import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateStudentParentDto {
  @IsString()
  @MinLength(2)
  parentFullName!: string;

  @IsEmail()
  parentEmail!: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsString()
  @MinLength(2)
  studentFullName!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  className?: string;

  /** Optional offline batch to enroll the student into on create. */
  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  batchId?: string;
}
