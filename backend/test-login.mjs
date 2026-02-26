import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcrypt';

const rawUrl = new URL(process.env.DATABASE_URL);
rawUrl.protocol = 'mariadb:';
rawUrl.searchParams.set('allowPublicKeyRetrieval', 'true');
const adapter = new PrismaMariaDb(rawUrl.toString());
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { email: 'admin@demo.edu.np' },
    });
    if (!user) {
      console.log('User NOT FOUND');
      return;
    }
    console.log(
      'User found:',
      user.email,
      'role:',
      user.role,
      'active:',
      user.isActive,
      'schoolId:',
      user.schoolId,
    );
    console.log('Hash prefix:', user.passwordHash.substring(0, 20));

    // Check password
    const valid = await bcrypt.compare('Admin@123', user.passwordHash);
    console.log('Password valid:', valid);

    // Check superadmin too
    const sa = await prisma.user.findUnique({
      where: { email: 'superadmin@sms.edu.np' },
    });
    if (sa) {
      console.log(
        'SuperAdmin found:',
        sa.email,
        'role:',
        sa.role,
        'active:',
        sa.isActive,
        'schoolId:',
        sa.schoolId,
      );
      const saValid = await bcrypt.compare('SuperAdmin@123', sa.passwordHash);
      console.log('SA Password valid:', saValid);
    } else {
      console.log('SuperAdmin NOT FOUND');
    }
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
