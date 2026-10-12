import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterTutorDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsDateString()
  dob!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(['HOME_TUTOR', 'OFFLINE_TUTOR'])
  role!: 'HOME_TUTOR' | 'OFFLINE_TUTOR';

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subjects!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  classes!: string[];

  @IsOptional()
  @IsString()
  documentsNote?: string;
}
