import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { iAuth } from 'common/interface/auth.interface';
import { AuthRepository } from 'repository';
import { AuthLoginDto, AuthSignUpDTO, AuthVarifyEmail } from './auth.dto';
import { CacheService } from 'common/service/cache.service';
import { SendEmail } from 'common/utils/email.event';
import { HydratedDocument } from 'mongoose';
import { ComparePassword } from 'common/utils/security/Hash';
import { Url } from 'url';

@Injectable()
export class authService {
  constructor(
    private readonly AuthRepository: AuthRepository,
    private readonly redis: CacheService,
    private readonly sendEmail: SendEmail,
  ) {}

  async signup(data: AuthSignUpDTO) : Promise<iAuth> {
    const ExistEmail = await this.AuthRepository.findOne({
      filter: { email: data.email },
    });

    if (ExistEmail) {
      throw new ConflictException('email is already exist');
    }

    const user = await this.AuthRepository.create(data);

    if (!user) {
      throw new BadRequestException('failed to add Auth');
    }

    this.sendEmail.emailEvent.emit('send_email', {
      email: user.email,
      name: user.username,
      userID: user._id,
    });

    return user;
  }

  async verifyEmail(data: AuthVarifyEmail): Promise<HydratedDocument<iAuth>> {
    let user = await this.AuthRepository.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException('email not found');
    }
    if (user.isverify) {
      throw new BadRequestException('email already verified');
    }

    console.log(user._id, 'dfjhsidfw');
    this.sendEmail.emailEvent.emit('varify_email', {
      email: user.email,
      code: data.code,
      name: user.username,
      userID: user._id,
    });

    return user;
  }

  async login(data: AuthLoginDto): Promise<{
    user: Omit<iAuth, 'password'>;
    accessToken: string;
  }> {
    const userWithPassword = await this.AuthRepository.findOne(
      { email: data.email },
      '+password',
    );

    if (
      !userWithPassword ||
      !(await ComparePassword({
        PlainText: data.password,
        CipherText: userWithPassword.password,
      }))
    ) {
      throw new UnauthorizedException('email or password is incorrect');
    }

    if (!userWithPassword.isverify) {
      throw new ForbiddenException('email is not verified');
    }

    const secret =
      userWithPassword.role === 'admin'
        ? process.env.ADMIN_JWT
        : process.env.USER_JWT;
    if (!secret) {
      throw new InternalServerErrorException('JWT signing secret is not configured');
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userWithPassword._id.toString(),
        role: userWithPassword.role,
        iat: issuedAt,
        exp: issuedAt + 15 * 60,
      }),
    ).toString('base64url');
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac('sha256', secret)
      .update(unsignedToken)
      .digest('base64url');

    const {
      _id,
      username,
      age,
      email,
      phone,
      gender,
      role,
      provider,
      isverify,
    } = userWithPassword;

    return {
      user: {
        _id,
        username,
        age,
        email,
        phone,
        gender,
        role,
        provider,
        isverify,
      },
      accessToken: `${unsignedToken}.${signature}`,
    };
  }

  async forgetPassword(data: AuthLoginDto): Promise<iAuth> {
    let user = await this.AuthRepository.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException('user is not exist');
    }

    this.sendEmail.emailEvent.emit('forget_password', {
      email: user.email,
      userID: user._id,
      name: user.username,
    });

    return user;
  }

  async resetPassword(id: string, data: any, host: Url | any): Promise<iAuth> {
    let loginUrl = `${host}/login`;
    let user = await this.AuthRepository.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException('user is not found');
    }
    if (!data.password || !data.code || !data.email) {
      throw new BadRequestException('code , password and email is required');
    }
    let updatePassword = await this.AuthRepository.findByIdAndUpdate(id, {
      password: user.password,
    });

    if (!updatePassword) {
      throw new BadRequestException('password not updated');
    }

    this.sendEmail.emailEvent.emit('resetPassword', {
      email: user.email,
      name: user.username,
      code: data.code,
      userID: user._id,
      host: loginUrl,
    });

    return user;
  }

  async getAllUsers(): Promise<HydratedDocument<iAuth>[]> {
    let allusers = await this.AuthRepository.find({}, { password: 0 });
    return allusers;
  }

  async getAllUsersByID(id: string): Promise<HydratedDocument<iAuth>> {
    let user = await this.AuthRepository.findById(id).select('-password');
    if (!user) {
      throw new BadRequestException('user not found');
    }
    return user;
  }

  async updateUserByID(
    id: string,
    data: Partial<iAuth>,
  ): Promise<HydratedDocument<iAuth>> {
    let { username, age, gender } = data;
    let user = await this.AuthRepository.findByIdAndUpdate(
      id,
      { data: { username, age, gender } },
      { new: 1 },
    ).select('-password');
    if (!user) {
      throw new BadRequestException('user not found');
    }
    return user;
  }
  async deleteUserByID(id: string): Promise<iAuth> {
    let user =
      await this.AuthRepository.findByIdAndDelete(id).select('-password');
    if (!user) {
      throw new BadRequestException('user not found');
    }
    return user;
  }
}
