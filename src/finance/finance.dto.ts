import { IsDateString, IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
export class CreateFeeDto {
  @IsString() @MinLength(1) studentId!: string;
  @IsString() @MinLength(2) @MaxLength(150) title!: string;
  @IsInt() @Min(1) @Max(100000000) amount!: number;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsDateString() dueAt!: string;
}
export class RecordPaymentDto {
  @IsInt() @Min(1) @Max(100000000) amount!: number;
  @IsString() @MinLength(1) @MaxLength(150) reference!: string;
  @IsString() @MinLength(8) @MaxLength(80) requestId!: string;
}
export class RecordSalaryDto {
  @IsString() @MinLength(1) tutorProfileId!: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) period!: string;
  @IsInt() @Min(1) @Max(100000000) amount!: number;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsString() @MinLength(1) @MaxLength(150) reference!: string;
}
