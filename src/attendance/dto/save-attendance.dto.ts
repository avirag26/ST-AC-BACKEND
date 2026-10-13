import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceMarkDto {
  @IsString()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

export class SaveAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceMarkDto)
  marks!: AttendanceMarkDto[];
}
