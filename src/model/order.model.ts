import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export const OrderStatuses = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof OrderStatuses)[number];

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  productId: Types.ObjectId;
  productName: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

@Schema({ timestamps: true, strict: true })
export class Order {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, required: true, ref: 'Product' },
        productName: { type: String, required: true },
        sku: { type: String },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        lineTotal: { type: Number, required: true, min: 0 },
      },
    ],
    required: true,
  })
  items!: OrderLine[];

  @Prop({
    type: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    required: true,
  })
  shippingAddress!: ShippingAddress;

  @Prop({ type: Number, required: true, min: 0 })
  subtotal!: number;

  @Prop({ type: String, enum: OrderStatuses, default: 'pending' })
  status!: OrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema },
]);
