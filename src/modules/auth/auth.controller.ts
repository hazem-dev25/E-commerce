import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { iAuth } from 'common/interface/auth.interface';
import { authService } from './auth.service';
import {
  AuthLoginDto,
  AuthSignUpDTO,
  AuthVarifyEmail,
} from './auth.dto';

@Controller('auth')
export class authController {
  constructor(private readonly authService: authService) {}

  @HttpCode(200)
  @Post('signup')
  async signup(@Body() data: AuthSignUpDTO) {
    return await this.authService.signup(data);
  }

  @HttpCode(200)
  @Post('verify-email')
  async verifyEmail(@Body() data: AuthVarifyEmail) {
    return await this.authService.verifyEmail(data);
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() data: AuthLoginDto) {
    return await this.authService.login(data);
  }

  @HttpCode(200)
  @Post('forget-password')
  async forgetPassword(@Body() data: AuthLoginDto) {
    return await this.authService.forgetPassword(data);
  }

  @HttpCode(201)
  @Post('reset-password/:id')
  async resetPassword(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: Request,
  ) {
    const host = req.get('host');
    return await this.authService.resetPassword(id, data, host);
  }

  @HttpCode(200)
  @Get('getUsers')
  async getAllUsers() {
    return await this.authService.getAllUsers();
  }

  @HttpCode(200)
  @Get('getUsersById/:id')
  async getAllUsersByID(@Param('id') id: string) {
    return await this.authService.getAllUsersByID(id);
  }

  @HttpCode(201)
  @Patch('UpdateUserById/:id')
  async updateUserByID(
    @Param('id') id: string,
    @Body() data: Partial<iAuth>,
  ) {
    return await this.authService.updateUserByID(id, data);
  }

  @HttpCode(200)
  @Delete('deleteUserByID/:id')
  async deleteUserByID(@Param('id') id: string) {
    return await this.authService.deleteUserByID(id);
  }
}
