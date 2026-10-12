import { IsString, MinLength } from 'class-validator';

export class CreateCatalogItemDto {
  @IsString()
  @MinLength(1)
  name!: string;
}
