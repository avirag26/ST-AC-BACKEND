import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class ExamSubjectDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @IsInt() @Min(1) @Max(1000) maxMarks!: number;
}
export class CreateExamDto {
  @IsString() @MinLength(2) @MaxLength(150) title!: string;
  @IsDateString() startsAt!: string;
  @IsString() @MinLength(1) tutorProfileId!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ExamSubjectDto) subjects!: ExamSubjectDto[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ArrayUnique() @IsString({ each: true }) studentIds!: string[];
}
export class SaveExamMarkDto {
  @IsEnum(AttendanceStatus) attendance!: AttendanceStatus;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) score?: number;
  @IsOptional() @IsString() @MaxLength(2000) feedback?: string;
}
