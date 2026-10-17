import { Module } from '@nestjs/common';
import { CartModel } from 'model/cart.model';
import { OrderModel } from 'model/order.model';
import { PaymentModel } from 'model/payment.model';
import { ProductModel } from 'model/product.model';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import { AdminGuard } from 'common/utils/security/admin.guard';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [CartModel, OrderModel, PaymentModel, ProductModel],
  controllers: [OrderController],
  providers: [OrderService, AccessTokenGuard, AdminGuard],
})
export class OrderModule {}
