import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 8000
  app.useGlobalPipes(new ValidationPipe({
    stopAtFirstError: true ,
    whitelist: true ,
    forbidNonWhitelisted: true
  }))

  
  app.listen(port  , ()=>{
    console.log(`server is running on port ${port}`);
  });
}
bootstrap();
