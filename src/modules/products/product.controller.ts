import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'common/utils/security/admin.guard';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AccessTokenGuard, AdminGuard)
  async create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.productService.update(id, data);
  }

  @HttpCode(200)
  @Delete(':id')
  @UseGuards(AccessTokenGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
