"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    config;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    connectPromise = null;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        this.client = new ioredis_1.default({
            host: this.config.get('REDIS_HOST', 'localhost'),
            port: Number(this.config.get('REDIS_PORT', '6379')),
            password: this.config.get('REDIS_PASSWORD') || undefined,
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
            }
            catch {
                this.client.disconnect();
            }
        }
    }
    getClient() {
        return this.client;
    }
    async ensureConnected() {
        if (!this.client)
            return false;
        if (this.client.status === 'ready')
            return true;
        if (!this.connectPromise) {
            this.connectPromise = this.client
                .connect()
                .then(() => undefined)
                .catch((err) => {
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
        }
        catch {
            return false;
        }
    }
    async get(key) {
        if (!(await this.ensureConnected()))
            return null;
        try {
            return await this.client.get(key);
        }
        catch (err) {
            this.logger.warn(`Redis GET failed: ${err.message}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!(await this.ensureConnected()))
            return false;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            }
            else {
                await this.client.set(key, value);
            }
            return true;
        }
        catch (err) {
            this.logger.warn(`Redis SET failed: ${err.message}`);
            return false;
        }
    }
    async del(key) {
        if (!(await this.ensureConnected()))
            return;
        try {
            await this.client.del(key);
        }
        catch (err) {
            this.logger.warn(`Redis DEL failed: ${err.message}`);
        }
    }
    async sAdd(key, member) {
        if (!(await this.ensureConnected()))
            return;
        try {
            await this.client.sadd(key, member);
        }
        catch (err) {
            this.logger.warn(`Redis SADD failed: ${err.message}`);
        }
    }
    async sRem(key, member) {
        if (!(await this.ensureConnected()))
            return;
        try {
            await this.client.srem(key, member);
        }
        catch (err) {
            this.logger.warn(`Redis SREM failed: ${err.message}`);
        }
    }
    async sMembers(key) {
        if (!(await this.ensureConnected()))
            return [];
        try {
            return await this.client.smembers(key);
        }
        catch (err) {
            this.logger.warn(`Redis SMEMBERS failed: ${err.message}`);
            return [];
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map