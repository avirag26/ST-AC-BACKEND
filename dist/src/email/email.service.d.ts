import { ConfigService } from '@nestjs/config';
export type WelcomeEmailPayload = {
    to: string;
    fullName: string;
    roleLabel: string;
    temporaryPassword: string;
};
export declare class EmailService {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    get configured(): boolean;
    send(to: string, subject: string, text: string): Promise<void>;
    sendWelcomeWithPassword(payload: WelcomeEmailPayload): Promise<{
        emailed: boolean;
        reason: string;
    }>;
}
