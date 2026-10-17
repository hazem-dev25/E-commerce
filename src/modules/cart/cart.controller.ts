import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import type { AuthenticatedRequest } from 'common/utils/security/access-token.guard';
import { AddCartItemDto, UpdateCartItemDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(AccessTokenGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCart(request.user.sub);
  }

  @Post('items')
  addItem(
    @Req() request: AuthenticatedRequest,
    @Body() data: AddCartItemDto,
  ) {
    return this.cartService.addItem(
      request.user.sub,
      data.productId,
      data.quantity,
    );
  }

  @Patch('items/:productId')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() data: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      request.user.sub,
      productId,
      data.quantity,
    );
  }

  @Delete('items/:productId')
  removeItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(request.user.sub, productId);
  }

  @Delete()
  clearCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.clearCart(request.user.sub);
  }
}