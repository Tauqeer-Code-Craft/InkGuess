import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './redis.service';
import { GameService } from './game.service';
import { RoomController } from './room.controller';

@Module({
  imports: [],
  controllers: [AppController,RoomController],
  providers: [AppService,RedisService,GameService],
})
export class AppModule {}
