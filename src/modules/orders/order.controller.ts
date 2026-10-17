import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'common/utils/security/admin.guard';
import { AccessTokenGuard } from 'common/utils/security/access-token.guard';
import type { AuthenticatedRequest } from 'common/utils/security/access-token.guard';
import { CheckoutDto, UpdateOrderStatusDto } from './order.dto';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(AccessTokenGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  checkout(@Req() request: AuthenticatedRequest, @Body() data: CheckoutDto) {
    return this.orderService.checkout(request.user.sub, data);
  }

  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.orderService.findMine(request.user.sub);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id') id: string, @Body() data: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(
      id,
      data.status,
      data.paymentReceived,
    );
  }
}
