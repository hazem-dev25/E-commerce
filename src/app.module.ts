import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'modules/auth/auth.module';
import { ProductsModule } from 'modules/products/product.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CartModule } from 'modules/cart/cart.module';
import { OrderModule } from 'modules/orders/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env.prod'],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URL as string, {
      serverSelectionTimeoutMS: 30000,
      onConnectionCreate: (connect: Connection) => {
        (connect.on('connected', () => console.log('DB is connected succ ✔')),
          connect.on('disconnect', () => console.log('DB is disconnected 🤦‍♀️')));
      },
    }),
    AuthModule,
    ProductsModule,
    CartModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
