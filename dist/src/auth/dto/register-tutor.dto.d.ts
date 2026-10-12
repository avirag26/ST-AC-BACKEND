export declare class RegisterTutorDto {
    fullName: string;
    dob: string;
    email: string;
    phone: string;
    password: string;
    role: 'HOME_TUTOR' | 'OFFLINE_TUTOR';
    subjects: string[];
    classes: string[];
    documentsNote?: string;
}
