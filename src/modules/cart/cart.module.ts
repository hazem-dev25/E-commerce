import { Module } from '@nestjs/common';
import { CartModel } from 'model/cart.model';
import { ProductModel } from 'model/product.model';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [CartModel, ProductModel],
  controllers: [CartController],
  providers: [CartService, AccessTokenGuard],
})
export class CartModule {}