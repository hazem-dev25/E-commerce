import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from 'model/product.model';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(data: CreateProductDto) {
    return this.productModel.create(data);
  }

  async findAll() {
    return this.productModel.find().sort({ createdAt: -1 }).exec();
  }

  async update(id: string, data: UpdateProductDto) {
    this.validateId(id);
    const product = await this.productModel
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
    if (!product) {
      throw new NotFoundException('product not found');
    }
    return product;
  }

  async remove(id: string) {
    this.validateId(id);
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) {
      throw new NotFoundException('product not found');
    }
    return product;
  }

  private validateId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('invalid product id');
    }
  }
}
