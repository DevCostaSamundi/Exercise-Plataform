import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create demo users
  const user1 = await prisma.user.upsert({
    where: { email: 'user@launchpad.com' },
    update: {},
    create: {
      email: 'user@launchpad.com',
      username: 'demouser',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      isVerified: true,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'creator@launchpad.com' },
    update: {},
    create: {
      email: 'creator@launchpad.com',
      username: 'democreator',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Creator',
      isVerified: true,
      role: 'CREATOR',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@launchpad.com' },
    update: {},
    create: {
      email: 'admin@launchpad.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
      role: 'ADMIN',
    },
  });

  console.log('Users created:', { user1, user2, admin });

  // Create creator profile
  const creator = await prisma.creator.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      displayName: 'Demo Creator',
      description: 'This is a demo creator account for Launchpad platform',
      isVerified: true,
      featured: true,
      kycStatus: 'APPROVED',
      subscriptionPrice: 9.99,
      socialLinks: {
        twitter: 'https://twitter.com/democreator',
        instagram: 'https://instagram.com/democreator',
      },
    },
  });

  console.log('Creator profile created:', creator);

  // Create demo posts
  const post1 = await prisma.post.create({
    data: {
      creatorId: creator.id,
      title: 'Welcome to my page!',
      content: 'This is my first post on Launchpad. Stay tuned for exclusive content!',
      mediaType: 'IMAGE',
      isPublic: true,
      isPPV: false,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      creatorId: creator.id,
      title: 'Exclusive Content',
      content: 'This is exclusive content for my subscribers only!',
      mediaType: 'VIDEO',
      isPublic: false,
      isPPV: false,
    },
  });

  console.log('Posts created:', { post1, post2 });

  // Create demo products
  const product1 = await prisma.product.create({
    data: {
      creatorId: creator.id,
      name: 'Exclusive Photo Pack',
      description: 'A collection of 50 exclusive photos',
      category: 'DIGITAL_CONTENT',
      type: 'DIGITAL',
      price: 19.99,
      isUnlimited: true,
      isActive: true,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      creatorId: creator.id,
      name: 'Pride Merchandise T-Shirt',
      description: 'Official Pride Connect T-shirt - Limited Edition',
      category: 'MERCHANDISE',
      type: 'PHYSICAL',
      price: 29.99,
      stock: 100,
      isUnlimited: false,
      isActive: true,
    },
  });

  console.log('Products created:', { product1, product2 });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
