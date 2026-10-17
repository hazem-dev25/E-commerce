import { Module, Type } from '@nestjs/common';
import { authController } from './auth.controller';
import { authService } from './auth.service';
import { AuthModel } from 'model/auth.model';
import { AuthRepository } from 'repository';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { CacheService } from 'common/service/cache.service';
import  { SendEmail } from 'common/utils/email.event';
import { EmailService } from '../../common/utils/email.service'
@Module({
  imports: [AuthModel ],
  exports: ["Redis_url"],
  controllers: [authController],
  providers: [
    {
      provide: 'Redis_url',
      useFactory: async (configservice: ConfigService) => {
        const client = createClient({
          url: configservice.get<string>('REDIS_URL'),
        });

        client.on('error', (error) => {
          console.log('failed to connect redis', error);
        });

        await client.connect();
        console.log('redis connected succ 👍');

        return client;
      },
      inject: [ConfigService],
    },
    SendEmail,
    EmailService,
    authService,
    AuthRepository,
    CacheService
  ],
})
export class AuthModule {}
