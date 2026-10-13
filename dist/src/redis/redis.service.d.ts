import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private client;
    private connectPromise;
    constructor(config: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    getClient(): Redis;
    private ensureConnected;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<void>;
    sAdd(key: string, member: string): Promise<void>;
    sRem(key: string, member: string): Promise<void>;
    sMembers(key: string): Promise<string[]>;
}
