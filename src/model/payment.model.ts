import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, strict: true })
export class Payment {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({ type: String, enum: ['cash_on_delivery'], required: true })
  method!: 'cash_on_delivery';

  @Prop({ type: String, enum: ['pending', 'paid'], default: 'pending' })
  status!: 'pending' | 'paid';
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
export const PaymentModel = MongooseModule.forFeature([
  { name: Payment.name, schema: PaymentSchema },
]);
