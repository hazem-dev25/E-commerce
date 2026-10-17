import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartLine } from 'model/cart.model';
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
        lineTotal: product ? product.price * item.quantity : 0,
      };
    });

    return {
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    };
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.getAvailableProduct(productId, quantity);
    const cart = await this.getOrCreateCart(userId);
    const existingItem = cart.items.find((item) =>
      item.productId.equals(product._id),
    );
    const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock) {
      throw new BadRequestException('requested quantity exceeds available stock');
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({ productId: product._id, quantity });
    }
    await cart.save();
    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const product = await this.getAvailableProduct(productId, quantity);
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((line) => line.productId.equals(product._id));
    if (!item) {
      throw new NotFoundException('cart item not found');
    }
    if (quantity > product.stock) {
      throw new BadRequestException('requested quantity exceeds available stock');
    }

    item.quantity = quantity;
    await cart.save();
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    this.validateProductId(productId);
    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex((item) =>
      item.productId.equals(productId),
    );
    if (itemIndex === -1) {
      throw new NotFoundException('cart item not found');
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    return { items: [], totalItems: 0, subtotal: 0 };
  }

  private async getAvailableProduct(productId: string, quantity: number) {
    this.validateProductId(productId);
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('product not found');
    }
    if (quantity > product.stock) {
      throw new BadRequestException('requested quantity exceeds available stock');
    }
    return product;
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
}