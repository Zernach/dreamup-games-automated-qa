import { Test, TestStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { CreateTestInput } from '../utils/validation';

export class TestService {
  // Create a new test
  async createTest(input: CreateTestInput): Promise<Test> {
    const test = await prisma.test.create({
      data: {
        gameUrl: input.gameUrl,
        status: 'pending',
      },
    });

    // Queue test execution asynchronously
    this.executeTest(test.id, input.options).catch((error) => {
      console.error(`Test ${test.id} execution failed:`, error);
      this.updateTestStatus(test.id, 'failed');
    });

    return test;
  }

  // Get test by ID with all related data
  async getTestById(testId: string) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        screenshots: true,
        issues: {
          orderBy: { severity: 'asc' },
        },
        consoleLogs: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
        networkErrors: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return test;
  }

  // List tests with pagination
  async listTests(page: number = 1, limit: number = 20, status?: TestStatus) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: {
          _count: {
            select: {
              issues: true,
              screenshots: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.test.count({ where }),
    ]);

    return {
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get test statistics
  async getStatistics() {
    const [totalTests, completedTests, avgScore, recentTests] = await Promise.all([
      prisma.test.count(),
      prisma.test.count({ where: { status: 'completed' } }),
      prisma.test.aggregate({
        where: {
          status: 'completed',
          playabilityScore: { not: null },
        },
        _avg: { playabilityScore: true },
      }),
      prisma.test.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    const passedTests = await prisma.test.count({
      where: {
        status: 'completed',
        playabilityScore: { gte: 70 },
      },
    });

    return {
      totalTests,
      averageScore: avgScore._avg.playabilityScore || 0,
      passRate: completedTests > 0 ? (passedTests / completedTests) * 100 : 0,
      testsLast7Days: recentTests,
    };
  }

  // Execute test (placeholder - will integrate Epic 1-3 modules)
  private async executeTest(testId: string, _options?: any) {
    // Update status to running
    await this.updateTestStatus(testId, 'running');

    // TODO: Integrate browser automation, evidence capture, and AI evaluation
    // For now, simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Update test with mock results
    await prisma.test.update({
      where: { id: testId },
      data: {
        status: 'completed',
        playabilityScore: 85.5,
        grade: 'B',
        confidence: 92.0,
        duration: 5000,
        scoreVisual: 90,
        scoreStability: 85,
        scoreInteraction: 80,
        scoreLoad: 95,
        reasoning: 'Mock test execution - browser automation not yet integrated',
        screenshots: {
          create: [
            {
              label: 'initial-load',
              filePath: `/data/${testId}/screenshots/initial-load.png`,
              fileSize: 125000,
            },
          ],
        },
      },
    });
  }

  // Update test status
  private async updateTestStatus(testId: string, status: TestStatus) {
    await prisma.test.update({
      where: { id: testId },
      data: { status },
    });
  }
}

export const testService = new TestService();
