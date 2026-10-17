import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import type { AuthenticatedRequest } from 'common/utils/security/access-token.guard';
import { SetCartItemDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(AccessTokenGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCart(request.user.sub);
  }

  @Put('items/:productId')
  setItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() data: SetCartItemDto,
  ) {
    return this.cartService.setItem(request.user.sub, productId, data.quantity);
  }
}
