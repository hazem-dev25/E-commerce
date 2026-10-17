import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, strict: true })
export class Product {
  @Prop({ type: Types.ObjectId })
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
  description!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  stock!: number;

  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  category!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: String, trim: true, maxlength: 64 })
  sku?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema },
]);