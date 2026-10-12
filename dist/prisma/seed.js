"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const SUBJECTS = [
    'Mathematics',
    'English',
    'Science',
    'Physics',
    'Chemistry',
    'Biology',
    'Social Studies',
    'Computer Science',
];
const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
async function main() {
    for (const name of SUBJECTS) {
        await prisma.subject.upsert({
            where: { name },
            update: { isActive: true },
            create: { name },
        });
    }
    for (const name of CLASSES) {
        await prisma.classGrade.upsert({
            where: { name },
            update: { isActive: true },
            create: { name },
        });
    }
    const phone = process.env.SEED_CEO_PHONE ?? '9999999999';
    const email = process.env.SEED_CEO_EMAIL ?? 'ceo@straightline.academy';
    const password = process.env.SEED_CEO_PASSWORD ?? 'Ceo@12345';
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
        where: { email },
        update: {
            phone,
            passwordHash,
            fullName: 'Academy CEO',
            role: client_1.UserRole.CEO,
            status: client_1.UserStatus.ACTIVE,
        },
        create: {
            phone,
            email,
            passwordHash,
            fullName: 'Academy CEO',
            role: client_1.UserRole.CEO,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const pendingEmail = 'pending.tutor@straightline.academy';
    const pendingPasswordHash = await bcrypt.hash('Tutor@12345', 10);
    await prisma.user.upsert({
        where: { email: pendingEmail },
        update: {
            phone: '9888888888',
            passwordHash: pendingPasswordHash,
            fullName: 'Pending Home Tutor',
            dob: new Date('1995-06-15'),
            role: client_1.UserRole.HOME_TUTOR,
            status: client_1.UserStatus.PENDING,
            rejectionReason: null,
            tutorProfile: {
                upsert: {
                    create: {
                        subjects: ['Mathematics', 'Science'],
                        classes: ['Class 8', 'Class 9', 'Class 10'],
                        documentsNote: 'B.Ed certificate pending upload',
                    },
                    update: {
                        subjects: ['Mathematics', 'Science'],
                        classes: ['Class 8', 'Class 9', 'Class 10'],
                        documentsNote: 'B.Ed certificate pending upload',
                    },
                },
            },
        },
        create: {
            phone: '9888888888',
            email: pendingEmail,
            passwordHash: pendingPasswordHash,
            fullName: 'Pending Home Tutor',
            dob: new Date('1995-06-15'),
            role: client_1.UserRole.HOME_TUTOR,
            status: client_1.UserStatus.PENDING,
            tutorProfile: {
                create: {
                    subjects: ['Mathematics', 'Science'],
                    classes: ['Class 8', 'Class 9', 'Class 10'],
                    documentsNote: 'B.Ed certificate pending upload',
                },
            },
        },
    });
    console.log('Seed complete');
    console.log(`CEO login phone: ${phone}`);
    console.log(`CEO login password: ${password}`);
    console.log('Sample pending tutor: Pending Home Tutor (9888888888)');
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map