const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const users = [
  { username: 'alice',   displayName: 'Alice Chen',    password: 'Password@123' },
  { username: 'bob',     displayName: 'Bob Marquez',   password: 'Password@123' },
  { username: 'charlie', displayName: 'Charlie Singh', password: 'Password@123' },
  { username: 'diana',   displayName: 'Diana Park',    password: 'Password@123' },
  { username: 'admin',   displayName: 'NEXUS Admin',   password: 'Admin@nexus1' },
];

async function main() {
  console.log('Seeding database...\n');

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where:  { username: u.username },
      update: { displayName: u.displayName, password: hashed },
      create: { username: u.username, displayName: u.displayName, password: hashed },
    });
    console.log(`  Created user: ${user.username} (${user.displayName})`);
  }

  console.log('\nSeeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
