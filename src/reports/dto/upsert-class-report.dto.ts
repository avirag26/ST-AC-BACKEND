import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertClassReportDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  topicsCovered!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  homework?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  studentNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  performance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextPlan?: string;
}
