import { Module } from '@nestjs/common';
import { ProductModel } from 'model/product.model';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [ProductModel],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductsModule {}