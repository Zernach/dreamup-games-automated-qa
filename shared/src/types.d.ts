export type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';
export type Severity = 'critical' | 'major' | 'minor';
export type IssueType = 'rendering' | 'interaction' | 'loading' | 'stability' | 'performance';
export type LogLevel = 'error' | 'warning' | 'info' | 'log' | 'debug';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export interface Screenshot {
    id: string;
    testId: string;
    label: string;
    filePath: string;
    fileSize: number;
    timestamp: Date;
}
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
export interface ConsoleLog {
    id: string;
    testId: string;
    level: LogLevel;
    message: string;
    timestamp: Date;
    occurrenceCount: number;
}
export interface NetworkError {
    id: string;
    testId: string;
    url: string;
    statusCode?: number;
    errorMessage: string;
    critical: boolean;
    timestamp: Date;
}
export interface ScoreComponents {
    visual: number;
    stability: number;
    interaction: number;
    load: number;
}
export interface PlayabilityScore {
    score: number;
    grade: Grade;
    components: ScoreComponents;
    confidence: number;
    reasoning: string;
}
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
export interface WebSocketEvent {
    type: 'test:started' | 'test:browser-launched' | 'test:ui-detected' | 'test:screenshot-captured' | 'test:ai-analyzing' | 'test:completed' | 'test:error';
    testId: string;
    timestamp: Date;
    data?: any;
}
export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    details?: any;
}
export interface APIConfig {
    apiUrl: string;
    wsUrl?: string;
    apiKey?: string;
}
export interface TestStatistics {
    totalTests: number;
    averageScore: number;
    passRate: number;
    testsLast7Days: number;
}
//# sourceMappingURL=types.d.ts.map