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
  filePath: string;
  fileSize: number;
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
export interface WebSocketEvent {
  type: 'test:started' | 'test:browser-launched' | 'test:ui-detected' |
        'test:screenshot-captured' | 'test:ai-analyzing' | 'test:completed' | 'test:error';
  testId: string;
  timestamp: Date;
  data?: any;
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
