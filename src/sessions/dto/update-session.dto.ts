import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateSessionDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  subjectName?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  tutorProfileId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  batchId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  studentId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
