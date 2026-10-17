import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatuses } from 'model/order.model';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country!: string;
}

export class CheckoutDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
}

export class UpdateOrderStatusDto {
  @IsIn(OrderStatuses)
  status!: (typeof OrderStatuses)[number];

  @IsOptional()
  @IsBoolean()
  paymentReceived?: boolean;
}
