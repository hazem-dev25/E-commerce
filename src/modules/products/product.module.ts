import { Module } from '@nestjs/common';
import { ProductModel } from 'model/product.model';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import { AdminGuard } from 'common/utils/security/admin.guard';

@Module({
  imports: [ProductModel],
  controllers: [ProductController],
  providers: [ProductService, AccessTokenGuard, AdminGuard],
})
export class ProductsModule {}
