import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly bucket;
    constructor(config: ConfigService);
    getUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
    getDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    deleteObject(key: string): Promise<void>;
}
