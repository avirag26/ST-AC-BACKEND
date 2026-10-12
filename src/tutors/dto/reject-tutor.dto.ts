import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectTutorDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
