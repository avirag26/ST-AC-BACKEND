import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { BatchesModule } from './batches/batches.module';
import { CatalogModule } from './catalog/catalog.module';
import { EmailModule } from './email/email.module';
import { JourneyModule } from './journey/journey.module';
import { ParentModule } from './parent/parent.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { SessionsModule } from './sessions/sessions.module';
import { StudentsModule } from './students/students.module';
import { TutorsModule } from './tutors/tutors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    StorageModule,
    EmailModule,
    AuthModule,
    CatalogModule,
    TutorsModule,
    StudentsModule,
    BatchesModule,
    SessionsModule,
    AttendanceModule,
    JourneyModule,
    ParentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
