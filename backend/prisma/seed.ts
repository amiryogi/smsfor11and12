import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

// The mariadb npm driver needs allowPublicKeyRetrieval for MySQL 8
const seedUrl = new URL(process.env.DATABASE_URL!);
seedUrl.protocol = 'mariadb:';
if (!seedUrl.searchParams.has('allowPublicKeyRetrieval')) {
  seedUrl.searchParams.set('allowPublicKeyRetrieval', 'true');
}
const adapter = new PrismaMariaDb(seedUrl.toString());
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create demo school
  const school = await prisma.school.upsert({
    where: { code: 'DEMO-001' },
    update: {},
    create: {
      name: 'Demo Higher Secondary School',
      code: 'DEMO-001',
      address: 'Kathmandu, Nepal',
      phone: '+977-1-4000000',
    },
  });
  console.log(`  ✅ School: ${school.name} (${school.id})`);

  // 2. Create super admin (assigned to school since schoolId is required)
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@sms.edu.np' },
    update: {},
    create: {
      email: 'superadmin@sms.edu.np',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      schoolId: school.id,
    },
  });
  console.log(`  ✅ Super Admin: ${superAdmin.email}`);

  // 3. Create school admin
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.edu.np' },
    update: {},
    create: {
      email: 'admin@demo.edu.np',
      passwordHash: adminPassword,
      firstName: 'School',
      lastName: 'Admin',
      role: 'ADMIN',
      schoolId: school.id,
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  // 4. Create accountant
  const accountantPassword = await bcrypt.hash('Accountant@123', 12);
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@demo.edu.np' },
    update: {},
    create: {
      email: 'accountant@demo.edu.np',
      passwordHash: accountantPassword,
      firstName: 'Ram',
      lastName: 'Sharma',
      role: 'ACCOUNTANT',
      schoolId: school.id,
    },
  });
  console.log(`  ✅ Accountant: ${accountant.email}`);

  // 5. Create teacher
  const teacherPassword = await bcrypt.hash('Teacher@123', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demo.edu.np' },
    update: {},
    create: {
      email: 'teacher@demo.edu.np',
      passwordHash: teacherPassword,
      firstName: 'Sita',
      lastName: 'Poudel',
      role: 'TEACHER',
      schoolId: school.id,
    },
  });
  console.log(`  ✅ Teacher: ${teacher.email}`);

  // 6. Create academic year (use findFirst + create pattern since no composite unique on name)
  let academicYear = await prisma.academicYear.findFirst({
    where: { schoolId: school.id, name: '2081' },
  });
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        schoolId: school.id,
        name: '2081',
        startDate: new Date('2024-04-14'),
        endDate: new Date('2025-04-13'),
        isCurrent: true,
      },
    });
  }
  console.log(`  ✅ Academic Year: ${academicYear.name}`);

  // 7. Create grades
  const grade11Science = await prisma.grade.upsert({
    where: {
      schoolId_level_section_stream: {
        schoolId: school.id,
        level: 11,
        section: 'A',
        stream: 'SCIENCE',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      level: 11,
      section: 'A',
      stream: 'SCIENCE',
      capacity: 40,
    },
  });

  const grade12Science = await prisma.grade.upsert({
    where: {
      schoolId_level_section_stream: {
        schoolId: school.id,
        level: 12,
        section: 'A',
        stream: 'SCIENCE',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      level: 12,
      section: 'A',
      stream: 'SCIENCE',
      capacity: 40,
    },
  });
  console.log(`  ✅ Grades: 11-A Science, 12-A Science`);

  // 8. Create subjects
  const subjectsData = [
    {
      name: 'English',
      code: 'ENG',
      creditHours: 4,
      hasTheory: true,
      hasPractical: false,
      theoryFullMarks: 100,
      practicalFullMarks: 0,
    },
    {
      name: 'Nepali',
      code: 'NEP',
      creditHours: 4,
      hasTheory: true,
      hasPractical: false,
      theoryFullMarks: 100,
      practicalFullMarks: 0,
    },
    {
      name: 'Physics',
      code: 'PHY',
      creditHours: 5,
      hasTheory: true,
      hasPractical: true,
      theoryFullMarks: 75,
      practicalFullMarks: 25,
    },
    {
      name: 'Chemistry',
      code: 'CHE',
      creditHours: 5,
      hasTheory: true,
      hasPractical: true,
      theoryFullMarks: 75,
      practicalFullMarks: 25,
    },
    {
      name: 'Mathematics',
      code: 'MAT',
      creditHours: 5,
      hasTheory: true,
      hasPractical: false,
      theoryFullMarks: 100,
      practicalFullMarks: 0,
    },
    {
      name: 'Computer Science',
      code: 'CS',
      creditHours: 4,
      hasTheory: true,
      hasPractical: true,
      theoryFullMarks: 75,
      practicalFullMarks: 25,
    },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: {
        schoolId_code: {
          schoolId: school.id,
          code: s.code,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        ...s,
      },
    });
    subjects.push(subject);
  }
  console.log(`  ✅ Subjects: ${subjects.map((s) => s.code).join(', ')}`);

  // 9. Assign subjects to grade 11
  for (const subject of subjects) {
    await prisma.gradeSubject.upsert({
      where: {
        gradeId_subjectId: {
          gradeId: grade11Science.id,
          subjectId: subject.id,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        gradeId: grade11Science.id,
        subjectId: subject.id,
      },
    });
  }
  console.log(`  ✅ Grade-Subject assignments for Grade 11`);

  // 9b. Assign subjects to grade 12
  for (const subject of subjects) {
    await prisma.gradeSubject.upsert({
      where: {
        gradeId_subjectId: {
          gradeId: grade12Science.id,
          subjectId: subject.id,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        gradeId: grade12Science.id,
        subjectId: subject.id,
      },
    });
  }
  console.log(`  ✅ Grade-Subject assignments for Grade 12`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('Login credentials:');
  console.log('  Super Admin: superadmin@sms.edu.np / SuperAdmin@123');
  console.log('  Admin:       admin@demo.edu.np / Admin@123');
  console.log('  Accountant:  accountant@demo.edu.np / Accountant@123');
  console.log('  Teacher:     teacher@demo.edu.np / Teacher@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
