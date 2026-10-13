import { AttendanceStatus } from '@prisma/client';
export declare class AttendanceMarkDto {
    studentId: string;
    status: AttendanceStatus;
}
export declare class SaveAttendanceDto {
    marks: AttendanceMarkDto[];
}
