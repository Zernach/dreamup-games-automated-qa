// Test Status
export type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

// Severity Levels
export type Severity = 'critical' | 'major' | 'minor';

// Issue Types
export type IssueType = 'rendering' | 'interaction' | 'loading' | 'stability' | 'performance';

// Console Log Levels
export type LogLevel = 'error' | 'warning' | 'info' | 'log' | 'debug';

// Test Grade
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

// Screenshot Model
export interface Screenshot {
  id: string;
  testId: string;
  label: string;
  filePath?: string;
  data?: string; // base64 encoded image data URL
  htmlDom?: string; // HTML DOM snapshot at time of screenshot
  fileSize?: number;
  timestamp: Date;
}

// Issue Model
export interface Issue {
  id: string;
  testId: string;
  severity: Severity;
  type: IssueType;
  description: string;
  confidence: number;
  timestamp: Date;
  evidence?: string[];
}

// Console Log Model
export interface ConsoleLog {
  id: string;
  testId: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  occurrenceCount: number;
}

// Network Error Model
export interface NetworkError {
  id: string;
  testId: string;
  url: string;
  statusCode?: number;
  errorMessage: string;
  critical: boolean;
  timestamp: Date;
}

// Playability Score Components
export interface ScoreComponents {
  visual: number;
  stability: number;
  interaction: number;
  load: number;
}

// Playability Score
export interface PlayabilityScore {
  score: number;
  grade: Grade;
  components: ScoreComponents;
  confidence: number;
  reasoning: string;
}

// Test Model
export interface Test {
  id: string;
  gameUrl: string;
  status: TestStatus;
  playabilityScore?: number;
  grade?: Grade;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
  duration?: number;
  screenshots?: Screenshot[];
  issues?: Issue[];
  consoleLogs?: ConsoleLog[];
  networkErrors?: NetworkError[];
  scoreComponents?: ScoreComponents;
  reasoning?: string;
}

// API Request Types
export interface CreateTestRequest {
  gameUrl: string;
  options?: {
    timeout?: number;
    screenshotCount?: number;
  };
}

export interface CreateTestResponse {
  testId: string;
  status: TestStatus;
  message: string;
}

export interface GetTestResponse {
  test: Test;
}

export interface ListTestsRequest {
  page?: number;
  limit?: number;
  status?: TestStatus;
}

export interface ListTestsResponse {
  tests: Test[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Event Types
export type WebSocketEventType =
  | 'test:created'
  | 'test:status-changed'
  | 'test:browser-launched'
  | 'test:page-loaded'
  | 'test:screenshot-captured'
  | 'test:action-performed'
  | 'test:ai-analyzing'
  | 'test:ai-analysis-complete'
  | 'test:evaluation-complete'
  | 'test:completed'
  | 'test:error';

export interface WebSocketEvent {
  type: WebSocketEventType;
  testId: string;
  timestamp: Date;
  data?: any;
}

export interface TestCreatedEvent extends WebSocketEvent {
  type: 'test:created';
  data: {
    testId: string;
    gameUrl: string;
    status: TestStatus;
  };
}

export interface TestStatusChangedEvent extends WebSocketEvent {
  type: 'test:status-changed';
  data: {
    status: TestStatus;
    message?: string;
  };
}

export interface ScreenshotCapturedEvent extends WebSocketEvent {
  type: 'test:screenshot-captured';
  data: {
    screenshot: Screenshot;
    progress: {
      current: number;
      total: number;
    };
  };
}

export interface ActionPerformedEvent extends WebSocketEvent {
  type: 'test:action-performed';
  data: {
    action: string;
    target: string;
    reason: string;
    success: boolean;
  };
}

export interface AIAnalyzingEvent extends WebSocketEvent {
  type: 'test:ai-analyzing';
  data: {
    stage: 'game-analysis' | 'quality-evaluation';
    message: string;
  };
}

export interface AIAnalysisCompleteEvent extends WebSocketEvent {
  type: 'test:ai-analysis-complete';
  data: {
    detectedElements: string[];
    interactivityScore: number;
    suggestedActionsCount: number;
  };
}

export interface EvaluationCompleteEvent extends WebSocketEvent {
  type: 'test:evaluation-complete';
  data: {
    playabilityScore: number;
    grade: Grade;
    confidence: number;
    issues: Issue[];
    scoreComponents: ScoreComponents;
    reasoning: string;
  };
}

export interface TestCompletedEvent extends WebSocketEvent {
  type: 'test:completed';
  data: {
    test: Test;
  };
}

export interface TestErrorEvent extends WebSocketEvent {
  type: 'test:error';
  data: {
    error: string;
    message: string;
  };
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

// API Configuration
export interface APIConfig {
  apiUrl: string;
  wsUrl?: string;
  apiKey?: string;
}

// Test Summary Statistics
export interface TestStatistics {
  totalTests: number;
  averageScore: number;
  passRate: number;
  testsLast7Days: number;
}
