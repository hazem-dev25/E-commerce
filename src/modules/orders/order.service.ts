import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from 'model/cart.model';
import { Order, OrderStatus, OrderStatuses } from 'model/order.model';
import { Payment } from 'model/payment.model';
import { Product } from 'model/product.model';
import { CheckoutDto } from './order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
  ) {}

  async checkout(userId: string, data: CheckoutDto) {
    const userObjectId = this.toUserObjectId(userId);
    const existingCart = await this.cartModel
      .findOne({ userId: userObjectId })
      .exec();
    if (!existingCart?.items.length) {
      throw new BadRequestException('cart is empty');
    }
    const cart = await this.cartModel
      .findOneAndUpdate(
        {
          _id: existingCart._id,
          $or: [
            { checkoutInProgress: { $ne: true } },
            { checkoutLockUntil: { $lt: new Date() } },
          ],
        },
        {
          $set: {
            checkoutInProgress: true,
            checkoutLockUntil: new Date(Date.now() + 5 * 60 * 1000),
          },
        },
        { new: true },
      )
      .exec();
    if (!cart) {
      throw new ConflictException('cart checkout is already in progress');
    }

    const reservedItems: Array<{
      productId: Types.ObjectId;
      quantity: number;
    }> = [];
    let orderId: Types.ObjectId | undefined;
    let paymentId: Types.ObjectId | undefined;

    try {
      if (!cart.items.length) {
        throw new BadRequestException('cart is empty');
      }

      const products = await this.productModel
        .find({ _id: { $in: cart.items.map((item) => item.productId) } })
        .exec();
      const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
      );
      const orderItems = cart.items.map((item) => {
        const product = productsById.get(item.productId.toString());
        if (!product) {
          throw new BadRequestException(
            'a product in the cart is no longer available',
          );
        }
        return {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: Number((product.price * item.quantity).toFixed(2)),
        };
      });
      const subtotal = Number(
        orderItems
          .reduce((total, item) => total + item.lineTotal, 0)
          .toFixed(2),
      );

      for (const item of orderItems) {
        const reserved = await this.productModel
          .findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true },
          )
          .exec();
        if (!reserved) {
          throw new ConflictException(
            `insufficient stock for ${item.productName}`,
          );
        }
        reservedItems.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      const order = await this.orderModel.create({
        userId: userObjectId,
        items: orderItems,
        shippingAddress: data.shippingAddress,
        subtotal,
        status: 'pending',
      });
      orderId = order._id;

      const payment = await this.paymentModel.create({
        orderId: order._id,
        userId: userObjectId,
        amount: subtotal,
        method: 'cash_on_delivery',
        status: 'pending',
      });
      paymentId = payment._id;
      order.paymentId = payment._id;
      await order.save();
      await this.cartModel.updateOne(
        { _id: cart._id },
        { $set: { items: [] } },
      );

      const result = await order.populate('paymentId');
      await this.cartModel.updateOne(
        { _id: cart._id },
        {
          $set: { checkoutInProgress: false },
          $unset: { checkoutLockUntil: 1 },
        },
      );
      return result;
    } catch (error) {
      try {
        if (paymentId) {
          await this.paymentModel.deleteOne({ _id: paymentId }).exec();
        }
        if (orderId) {
          await this.orderModel.deleteOne({ _id: orderId }).exec();
        }
        await Promise.all(
          reservedItems.map(({ productId, quantity }) =>
            this.productModel
              .updateOne({ _id: productId }, { $inc: { stock: quantity } })
              .exec(),
          ),
        );
        await this.cartModel.updateOne(
          { _id: cart._id },
          { $set: { items: cart.items } },
        );
      } finally {
        await this.cartModel
          .updateOne(
            { _id: cart._id },
            {
              $set: { checkoutInProgress: false },
              $unset: { checkoutLockUntil: 1 },
            },
          )
          .exec();
      }
      throw error;
    }
  }

  async findMine(userId: string) {
    return this.orderModel
      .find({ userId: this.toUserObjectId(userId) })
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(orderId: string, status: string, paymentReceived = false) {
    this.validateOrderId(orderId);
    if (!OrderStatuses.includes(status as OrderStatus)) {
      throw new BadRequestException('invalid order status');
    }

    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('order not found');
    }
    const nextStatus = status as OrderStatus;
    if (paymentReceived && nextStatus !== 'delivered') {
      throw new BadRequestException(
        'cash can only be recorded when the order is delivered',
      );
    }
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };
    if (!transitions[order.status].includes(nextStatus)) {
      throw new BadRequestException(
        `cannot change order from ${order.status} to ${nextStatus}`,
      );
    }

    const updatedOrder = await this.orderModel
      .findOneAndUpdate(
        { _id: order._id, status: order.status },
        { $set: { status: nextStatus } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updatedOrder) {
      throw new ConflictException('order status changed; reload and try again');
    }
    if (nextStatus === 'cancelled') {
      await Promise.all(
        order.items.map((item) =>
          this.productModel
            .updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity } },
            )
            .exec(),
        ),
      );
    }
    if (paymentReceived) {
      if (!updatedOrder.paymentId) {
        throw new NotFoundException('payment not found for order');
      }
      const payment = await this.paymentModel
        .findOne({
          _id: updatedOrder.paymentId,
          method: 'cash_on_delivery',
          status: 'pending',
        })
        .exec();
      if (!payment) {
        throw new NotFoundException(
          'pending cash-on-delivery payment not found',
        );
      }
      await this.paymentModel.updateOne(
        { _id: payment._id },
        { $set: { status: 'paid' } },
      );
    }
    return updatedOrder.populate('paymentId');
  }

  private toUserObjectId(userId: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('invalid user id in access token');
    }
    return new Types.ObjectId(userId);
  }

  private validateOrderId(orderId: string): void {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('invalid order id');
    }
  }
}
