import { IsInt, Min } from 'class-validator';

export class SetCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}
