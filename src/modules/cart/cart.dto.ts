import { IsInt, IsMongoId, IsNotEmpty, Min } from 'class-validator';

export class AddCartItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}