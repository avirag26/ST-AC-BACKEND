import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
      role: UserRole.CEO,
      status: UserStatus.ACTIVE,
    },
    create: {
      phone,
      email,
      passwordHash,
      fullName: 'Academy CEO',
      role: UserRole.CEO,
      status: UserStatus.ACTIVE,
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
      role: UserRole.HOME_TUTOR,
      status: UserStatus.PENDING,
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
      role: UserRole.HOME_TUTOR,
      status: UserStatus.PENDING,
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
