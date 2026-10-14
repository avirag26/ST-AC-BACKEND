import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsInt, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
export class QuestionDto {
  @IsString() @MinLength(2) @MaxLength(1000) prompt!: string;
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(300, { each: true }) options!: string[];
  @IsInt() @Min(0) @Max(5) correct!: number;
}
export class CreateQuizDto {
  @IsString() @MinLength(2) @MaxLength(150) title!: string;
  @IsDateString() dueAt!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => QuestionDto) questions!: QuestionDto[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ArrayUnique() @IsString({ each: true }) studentIds!: string[];
}
export class SubmitQuizDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @IsInt({ each: true }) @Min(0, { each: true }) @Max(5, { each: true }) answers!: number[];
}
