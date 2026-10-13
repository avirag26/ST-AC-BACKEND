import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<string>('REDIS_PORT', '6379')),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }

  getClient(): Redis {
    return this.client;
  }

  private async ensureConnected(): Promise<boolean> {
    if (!this.client) return false;
    if (this.client.status === 'ready') return true;
    if (!this.connectPromise) {
      this.connectPromise = this.client
        .connect()
        .then(() => undefined)
        .catch((err: Error) => {
          this.logger.warn(`Redis connect failed: ${err.message}`);
          throw err;
        })
        .finally(() => {
          this.connectPromise = null;
        });
    }
    try {
      await this.connectPromise;
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!(await this.ensureConnected())) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.warn(`Redis GET failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!(await this.ensureConnected())) return false;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (err) {
      this.logger.warn(`Redis SET failed: ${(err as Error).message}`);
      return false;
    }
  }

  async del(key: string): Promise<void> {
    if (!(await this.ensureConnected())) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed: ${(err as Error).message}`);
    }
  }

  async sAdd(key: string, member: string): Promise<void> {
    if (!(await this.ensureConnected())) return;
    try {
      await this.client.sadd(key, member);
    } catch (err) {
      this.logger.warn(`Redis SADD failed: ${(err as Error).message}`);
    }
  }

  async sRem(key: string, member: string): Promise<void> {
    if (!(await this.ensureConnected())) return;
    try {
      await this.client.srem(key, member);
    } catch (err) {
      this.logger.warn(`Redis SREM failed: ${(err as Error).message}`);
    }
  }

  async sMembers(key: string): Promise<string[]> {
    if (!(await this.ensureConnected())) return [];
    try {
      return await this.client.smembers(key);
    } catch (err) {
      this.logger.warn(`Redis SMEMBERS failed: ${(err as Error).message}`);
      return [];
    }
  }
}
