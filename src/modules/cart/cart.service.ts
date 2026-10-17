import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from 'model/cart.model';
import { Product } from 'model/product.model';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const products = await this.productModel
      .find({ _id: { $in: cart.items.map((item) => item.productId) } })
      .exec();
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    const items = cart.items.map((item) => {
      const product = productsById.get(item.productId.toString());
      return {
        product: product
          ? {
              id: product._id,
              name: product.name,
              price: product.price,
              images: product.images,
              stock: product.stock,
            }
          : null,
        quantity: item.quantity,
        lineTotal: product
          ? Number((product.price * item.quantity).toFixed(2))
          : 0,
      };
    });

    return {
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: Number(
        items.reduce((total, item) => total + item.lineTotal, 0).toFixed(2),
      ),
    };
  }

  async setItem(userId: string, productId: string, quantity: number) {
    this.validateProductId(productId);
    const cart = await this.lockCart(userId);
    try {
      const itemIndex = cart.items.findIndex((item) =>
        item.productId.equals(productId),
      );
      if (quantity === 0) {
        if (itemIndex !== -1) {
          cart.items.splice(itemIndex, 1);
        }
      } else {
        const product = await this.productModel.findById(productId).exec();
        if (!product) {
          throw new NotFoundException('product not found');
        }
        if (quantity > product.stock) {
          throw new BadRequestException(
            'requested quantity exceeds available stock',
          );
        }
        if (itemIndex === -1) {
          cart.items.push({ productId: product._id, quantity });
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
      }
      await cart.save();
      return await this.getCart(userId);
    } finally {
      await this.releaseCart(cart._id);
    }
  }

  private async getOrCreateCart(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('invalid user id in access token');
    }
    return this.cartModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $setOnInsert: { userId: new Types.ObjectId(userId), items: [] } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  private validateProductId(productId: string): void {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('invalid product id');
    }
  }

  private async lockCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const lockedCart = await this.cartModel
      .findOneAndUpdate(
        {
          _id: cart._id,
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
    if (!lockedCart) {
      throw new ConflictException('cart checkout or update is in progress');
    }
    return lockedCart;
  }

  private async releaseCart(cartId: Types.ObjectId) {
    await this.cartModel
      .updateOne(
        { _id: cartId },
        {
          $set: { checkoutInProgress: false },
          $unset: { checkoutLockUntil: 1 },
        },
      )
      .exec();
  }
}
