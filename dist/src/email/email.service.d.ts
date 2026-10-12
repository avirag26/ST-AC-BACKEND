export type WelcomeEmailPayload = {
    to: string;
    fullName: string;
    roleLabel: string;
    temporaryPassword: string;
};
export declare class EmailService {
    private readonly logger;
    sendWelcomeWithPassword(payload: WelcomeEmailPayload): Promise<{
        emailed: boolean;
        reason: string;
    }>;
}
