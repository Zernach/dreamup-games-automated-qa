import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample API key
  const apiKey = await prisma.apiKey.create({
    data: {
      key: randomUUID(),
      name: 'Development Key',
    },
  });

  console.log('Created API Key:', apiKey.key);
  console.log('Save this key for testing!');

  // Create sample test data
  const test1 = await prisma.test.create({
    data: {
      gameUrl: 'https://example.com/game1',
      status: 'completed',
      playabilityScore: 85.5,
      grade: 'B',
      confidence: 92.0,
      duration: 95000,
      scoreVisual: 90,
      scoreStability: 85,
      scoreInteraction: 80,
      scoreLoad: 95,
      reasoning: 'Game loads successfully with minor UI issues detected.',
      screenshots: {
        create: [
          {
            label: 'initial-load',
            filePath: '/data/test1/screenshots/initial-load.png',
            fileSize: 125000,
          },
          {
            label: 'mid-game',
            filePath: '/data/test1/screenshots/mid-game.png',
            fileSize: 130000,
          },
        ],
      },
      issues: {
        create: [
          {
            severity: 'minor',
            type: 'rendering',
            description: 'Slight text clipping in menu',
            confidence: 75,
            evidence: ['/data/test1/screenshots/initial-load.png'],
          },
        ],
      },
    },
  });

  const test2 = await prisma.test.create({
    data: {
      gameUrl: 'https://example.com/game2',
      status: 'completed',
      playabilityScore: 45.0,
      grade: 'F',
      confidence: 88.0,
      duration: 120000,
      scoreVisual: 30,
      scoreStability: 50,
      scoreInteraction: 40,
      scoreLoad: 60,
      reasoning: 'Critical JavaScript errors prevent game from starting.',
      issues: {
        create: [
          {
            severity: 'critical',
            type: 'stability',
            description: 'Uncaught TypeError: Cannot read property of undefined',
            confidence: 95,
            evidence: ['console.log line 45'],
          },
        ],
      },
      consoleLogs: {
        create: [
          {
            level: 'error',
            message: 'Uncaught TypeError: Cannot read property of undefined',
            occurrenceCount: 3,
          },
        ],
      },
    },
  });

  console.log('Created sample tests:', test1.id, test2.id);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
