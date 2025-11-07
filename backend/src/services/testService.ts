import { v4 as uuidv4 } from 'uuid';
import { CreateTestInput } from '../utils/validation';
import {
  Test,
  TestStatus,
  Screenshot,
  Issue,
  ConsoleLog,
  NetworkError,
  WebSocketEvent,
} from '../types';
import { playwrightService } from './playwrightService';
import { openaiService } from './openaiService';
import { websocketService } from './websocketService';

// In-memory storage
const tests = new Map<string, Test>();
const screenshots = new Map<string, Screenshot[]>();
const issues = new Map<string, Issue[]>();
const consoleLogs = new Map<string, ConsoleLog[]>();
const networkErrors = new Map<string, NetworkError[]>();

export class TestService {
  // Emit WebSocket event
  private emitEvent(testId: string, type: WebSocketEvent['type'], data?: any) {
    websocketService.emitToTest(testId, {
      type,
      testId,
      timestamp: new Date(),
      data,
    });
  }

  // Create a new test
  async createTest(input: CreateTestInput): Promise<Test> {
    const test: Test = {
      id: uuidv4(),
      gameUrl: input.gameUrl,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tests.set(test.id, test);
    screenshots.set(test.id, []);
    issues.set(test.id, []);
    consoleLogs.set(test.id, []);
    networkErrors.set(test.id, []);

    // Emit test created event
    this.emitEvent(test.id, 'test:created', {
      testId: test.id,
      gameUrl: test.gameUrl,
      status: test.status,
    });

    // Queue test execution asynchronously
    this.executeTest(test.id, input.options).catch((error) => {
      console.error(`Test ${test.id} execution failed:`, error);
      this.updateTestStatus(test.id, 'failed');
      this.emitEvent(test.id, 'test:error', {
        error: 'execution_failed',
        message: error instanceof Error ? error.message : String(error),
      });
    });

    return test;
  }

  // Get test by ID with all related data
  async getTestById(testId: string): Promise<Test | null> {
    const test = tests.get(testId);
    if (!test) {
      return null;
    }

    return {
      ...test,
      screenshots: screenshots.get(testId) || [],
      issues: (issues.get(testId) || []).sort((a, b) => {
        const severityOrder = { critical: 0, major: 1, minor: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      consoleLogs: (consoleLogs.get(testId) || [])
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 100),
      networkErrors: (networkErrors.get(testId) || []).sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
    };
  }

  // List tests with pagination
  async listTests(
    page: number = 1,
    limit: number = 20,
    status?: TestStatus
  ): Promise<{
    tests: Array<Test & { _count?: { issues: number; screenshots: number } }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    // Filter tests by status if provided
    let filteredTests = Array.from(tests.values());
    if (status) {
      filteredTests = filteredTests.filter((test) => test.status === status);
    }

    // Sort by createdAt desc
    filteredTests.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const total = filteredTests.length;
    const paginatedTests = filteredTests.slice(skip, skip + limit);

    // Add counts
    const testsWithCounts = paginatedTests.map((test) => ({
      ...test,
      _count: {
        issues: issues.get(test.id)?.length || 0,
        screenshots: screenshots.get(test.id)?.length || 0,
      },
    }));

    return {
      tests: testsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get test statistics
  async getStatistics(): Promise<{
    totalTests: number;
    averageScore: number;
    passRate: number;
    testsLast7Days: number;
  }> {
    const allTests = Array.from(tests.values());
    const totalTests = allTests.length;

    const completedTests = allTests.filter((t) => t.status === 'completed');
    const completedTestsCount = completedTests.length;

    const testsWithScores = completedTests.filter(
      (t) => t.playabilityScore !== undefined && t.playabilityScore !== null
    );

    const avgScore =
      testsWithScores.length > 0
        ? testsWithScores.reduce((sum, t) => sum + (t.playabilityScore || 0), 0) /
        testsWithScores.length
        : 0;

    const passedTests = completedTests.filter(
      (t) => (t.playabilityScore || 0) >= 70
    );

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTests = allTests.filter(
      (t) => t.createdAt.getTime() >= sevenDaysAgo.getTime()
    );

    return {
      totalTests,
      averageScore: avgScore,
      passRate:
        completedTestsCount > 0
          ? (passedTests.length / completedTestsCount) * 100
          : 0,
      testsLast7Days: recentTests.length,
    };
  }

  // Execute test with Playwright browser automation
  private async executeTest(testId: string, options?: any) {
    // Update status to running
    await this.updateTestStatus(testId, 'running');
    this.emitEvent(testId, 'test:status-changed', {
      status: 'running',
      message: 'Starting test execution...',
    });

    try {
      // Run Playwright test with screenshot capture
      const result = await playwrightService.runTest(
        tests.get(testId)?.gameUrl || '',
        {
          timeout: options?.timeout,
          screenshotCount: options?.screenshotCount,
        },
        // Pass callback for real-time updates
        (event) => {
          // Handle different event types
          if (event.type === 'screenshot-captured') {
            const screenshot: Screenshot = {
              id: event.data.screenshot.id,
              testId,
              label: event.data.screenshot.label,
              data: event.data.screenshot.data,
              htmlDom: event.data.screenshot.htmlDom,
              timestamp: event.data.screenshot.timestamp,
            };

            // Add to screenshots collection
            const currentScreenshots = screenshots.get(testId) || [];
            currentScreenshots.push(screenshot);
            screenshots.set(testId, currentScreenshots);

            // Emit to WebSocket clients
            this.emitEvent(testId, 'test:screenshot-captured', {
              screenshot,
              progress: event.data.progress,
            });
          } else if (event.type === 'action-performed') {
            this.emitEvent(testId, 'test:action-performed', event.data);
          } else if (event.type === 'browser-launched') {
            this.emitEvent(testId, 'test:browser-launched', event.data);
          } else if (event.type === 'page-loaded') {
            this.emitEvent(testId, 'test:page-loaded', event.data);
          } else if (event.type === 'ai-analyzing') {
            this.emitEvent(testId, 'test:ai-analyzing', event.data);
          } else if (event.type === 'ai-analysis-complete') {
            this.emitEvent(testId, 'test:ai-analysis-complete', event.data);
          }
        }
      );

      // Update test with results
      const test = tests.get(testId);
      if (test) {
        // Screenshots are already added via callback, but ensure we have them all
        const existingScreenshots = screenshots.get(testId) || [];
        if (existingScreenshots.length === 0) {
          // Fallback: Convert Playwright screenshots to Screenshot model
          const testScreenshots: Screenshot[] = result.screenshots.map((ps) => ({
            id: ps.id,
            testId,
            label: ps.label,
            data: ps.data, // base64 encoded image
            htmlDom: ps.htmlDom,
            timestamp: ps.timestamp,
          }));
          screenshots.set(testId, testScreenshots);
        }

        // Use AI to evaluate game quality
        console.log('Evaluating game quality with AI...');
        this.emitEvent(testId, 'test:ai-analyzing', {
          stage: 'quality-evaluation',
          message: 'AI is evaluating game quality and playability...',
        });

        const evaluation = await openaiService.evaluateGameQuality(
          result.screenshots.map(s => ({ label: s.label, data: s.data })),
          result.duration,
          result.success
        );

        // Store AI-detected issues
        const aiIssues: Issue[] = evaluation.issues.map((issue) => ({
          id: uuidv4(),
          testId,
          severity: issue.severity,
          type: issue.type,
          description: issue.description,
          confidence: issue.confidence,
          timestamp: new Date(),
        }));
        issues.set(testId, aiIssues);

        // Update test with AI evaluation results
        test.status = result.success ? 'completed' : 'partial';
        test.playabilityScore = evaluation.playabilityScore;
        test.grade = evaluation.grade;
        test.confidence = evaluation.confidence;
        test.duration = result.duration;
        test.scoreComponents = evaluation.scoreComponents;

        // Build comprehensive reasoning including AI analysis and actions
        let reasoning = evaluation.reasoning;
        if (result.aiAnalysis) {
          reasoning += `\n\nAI detected ${result.aiAnalysis.detectedElements.length} interactive elements: ${result.aiAnalysis.detectedElements.slice(0, 5).join(', ')}`;
          reasoning += `\nInteractivity score: ${result.aiAnalysis.interactivityScore}/100`;
        }
        if (result.actionsPerformed && result.actionsPerformed.length > 0) {
          reasoning += `\n\nActions performed (${result.actionsPerformed.length}): ${result.actionsPerformed.slice(0, 3).join('; ')}`;
        }
        test.reasoning = reasoning;

        test.updatedAt = new Date();
        tests.set(testId, test);

        // Emit evaluation complete event
        this.emitEvent(testId, 'test:evaluation-complete', {
          playabilityScore: evaluation.playabilityScore,
          grade: evaluation.grade,
          confidence: evaluation.confidence,
          issues: aiIssues,
          scoreComponents: evaluation.scoreComponents,
          reasoning,
        });

        // Emit test completed event
        this.emitEvent(testId, 'test:completed', {
          test: await this.getTestById(testId),
        });

        console.log(`Test ${testId} completed - Score: ${evaluation.playabilityScore}, Grade: ${evaluation.grade}`);
      }
    } catch (error) {
      console.error(`Test ${testId} execution failed:`, error);
      await this.updateTestStatus(testId, 'failed');

      const test = tests.get(testId);
      if (test) {
        test.reasoning = `Test execution failed: ${error instanceof Error ? error.message : String(error)}`;
        test.updatedAt = new Date();
        tests.set(testId, test);
      }

      // Emit error event
      this.emitEvent(testId, 'test:error', {
        error: 'execution_failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Update test status
  private async updateTestStatus(testId: string, status: TestStatus) {
    const test = tests.get(testId);
    if (test) {
      test.status = status;
      test.updatedAt = new Date();
      tests.set(testId, test);

      // Emit status change event
      this.emitEvent(testId, 'test:status-changed', {
        status,
      });
    }
  }
}

export const testService = new TestService();
