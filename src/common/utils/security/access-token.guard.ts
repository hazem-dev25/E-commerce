import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { sub: string; role: string };
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    const [encodedHeader, encodedPayload, signature, extra] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature || extra) {
      throw new UnauthorizedException('valid bearer token required');
    }

    try {
      const header = JSON.parse(
        Buffer.from(encodedHeader, 'base64url').toString('utf8'),
      ) as { alg?: string };
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as { sub?: string; role?: string; exp?: number };

      if (
        header.alg !== 'HS256' ||
        !payload.sub ||
        !payload.role ||
        typeof payload.exp !== 'number' ||
        payload.exp <= Math.floor(Date.now() / 1000)
      ) {
        throw new UnauthorizedException('invalid or expired bearer token');
      }

      const secret =
        payload.role === 'admin'
          ? process.env.ADMIN_JWT
          : payload.role === 'user'
            ? process.env.USER_JWT
            : undefined;
      if (!secret) {
        throw new UnauthorizedException('invalid bearer token');
      }

      const expected = createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();
      const actual = Buffer.from(signature, 'base64url');
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        throw new UnauthorizedException('invalid bearer token');
      }

      request.user = { sub: payload.sub, role: payload.role };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('invalid bearer token');
    }
  }
}