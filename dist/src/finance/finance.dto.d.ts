export declare class CreateFeeDto {
    studentId: string;
    title: string;
    amount: number;
    currency: string;
    dueAt: string;
}
export declare class RecordPaymentDto {
    amount: number;
    reference: string;
    requestId: string;
}
export declare class RecordSalaryDto {
    tutorProfileId: string;
    period: string;
    amount: number;
    currency: string;
    reference: string;
}
