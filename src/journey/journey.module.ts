import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { JourneyController } from './journey.controller';
import { JourneyService } from './journey.service';

@Module({
  imports: [RedisModule],
  controllers: [JourneyController],
  providers: [JourneyService],
  exports: [JourneyService],
})
export class JourneyModule {}
