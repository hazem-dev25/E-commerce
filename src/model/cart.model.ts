import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Product } from './product.model';

export interface CartLine {
  productId: Types.ObjectId;
  quantity: number;
}

@Schema({ timestamps: true, strict: true })
export class Cart {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: {
          type: Types.ObjectId,
          ref: Product.name,
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    default: [],
  })
  items!: CartLine[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: CartSchema },
]);