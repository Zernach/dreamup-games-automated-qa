import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Test {
    id: string;
    gameUrl: string;
    status: string;
    playabilityScore?: number;
    grade?: string;
    confidence?: number;
    duration?: number;
    createdAt: string;
    scoreComponents?: {
        visual: number;
        stability: number;
        interaction: number;
        load: number;
    };
    reasoning?: string;
    screenshots?: Array<{
        id: string;
        label: string;
        filePath?: string;
        data?: string;
        timestamp: string;
    }>;
    issues?: Array<{
        id: string;
        severity: string;
        type: string;
        description: string;
        confidence: number;
    }>;
}

interface LiveUpdate {
    timestamp: string;
    message: string;
    screenshot?: {
        id: string;
        label: string;
        data?: string;
        timestamp: string;
    };
}

export default function TestResultsPage() {
    const { id: testId } = useParams<{ id: string }>();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(true);
    const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [modalImage, setModalImage] = useState<{ src: string; label: string } | null>(null);

    // WebSocket connection for real-time updates
    useWebSocket(testId || null, {
        onConnect: () => {
            console.log('Connected to WebSocket');
            setWsConnected(true);
        },
        onDisconnect: () => {
            console.log('Disconnected from WebSocket');
            setWsConnected(false);
        },
        onEvent: (event) => {
            console.log('Received WebSocket event:', event);

            // Add live update message
            const timestamp = new Date(event.timestamp).toLocaleTimeString();
            let message = '';
            let screenshot = undefined;

            switch (event.type) {
                case 'test:created':
                    message = `Test created for ${event.data.gameUrl}`;
                    break;
                case 'test:status-changed':
                    message = `Status: ${event.data.status.toUpperCase()}${event.data.message ? ' - ' + event.data.message : ''}`;
                    // Update test status immediately
                    setTest(prev => prev ? { ...prev, status: event.data.status } : null);
                    break;
                case 'test:browser-launched':
                    message = 'Browser launched successfully';
                    break;
                case 'test:page-loaded':
                    message = `Game page loaded: ${event.data.url}`;
                    break;
                case 'test:screenshot-captured':
                    message = `Screenshot captured: ${event.data.screenshot.label} (${event.data.progress.current}/${event.data.progress.total})`;
                    screenshot = event.data.screenshot;
                    // Add screenshot to test immediately
                    setTest(prev => {
                        if (!prev) return null;
                        const screenshots = prev.screenshots || [];
                        const existingIndex = screenshots.findIndex(s => s.id === event.data.screenshot.id);
                        if (existingIndex === -1) {
                            return { ...prev, screenshots: [...screenshots, event.data.screenshot] };
                        }
                        return prev;
                    });
                    break;
                case 'test:action-performed':
                    message = `Action: ${event.data.action} on ${event.data.target} ${event.data.success ? '✓' : '✗'}`;
                    break;
                case 'test:ai-analyzing':
                    message = `AI analyzing: ${event.data.message}`;
                    break;
                case 'test:ai-analysis-complete':
                    message = `AI detected ${event.data.detectedElements.length} elements, interactivity score: ${event.data.interactivityScore}/100`;
                    break;
                case 'test:evaluation-complete':
                    message = `Evaluation complete: Score ${event.data.playabilityScore}, Grade ${event.data.grade}`;
                    // Update test with evaluation results
                    setTest(prev => prev ? {
                        ...prev,
                        playabilityScore: event.data.playabilityScore,
                        grade: event.data.grade,
                        confidence: event.data.confidence,
                        scoreComponents: event.data.scoreComponents,
                        reasoning: event.data.reasoning,
                        issues: event.data.issues,
                    } : null);
                    break;
                case 'test:completed':
                    message = 'Test completed successfully!';
                    setTest(event.data.test);
                    setPolling(false);
                    break;
                case 'test:error':
                    message = `Error: ${event.data.message}`;
                    setError(event.data.message);
                    setPolling(false);
                    break;
                default:
                    message = `Event: ${event.type}`;
            }

            setLiveUpdates(prev => [...prev, { timestamp, message, screenshot }].slice(-20)); // Keep last 20 updates
        },
    });

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;

            const response = await apiClient.get<{ test: Test }>(`/api/test/${testId}`);

            if (response.error) {
                setError(response.error);
                setLoading(false);
                setPolling(false);
                return;
            }

            if (response.data?.test) {
                setTest(response.data.test);
                setLoading(false);

                // Stop polling if test is complete or failed
                if (['completed', 'failed'].includes(response.data.test.status)) {
                    setPolling(false);
                }
            }
        };

        // Initial fetch
        fetchTest();

        // Fallback polling every 5 seconds if WebSocket is not connected
        let interval: NodeJS.Timeout;
        if (polling && !wsConnected) {
            interval = setInterval(fetchTest, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [testId, polling, wsConnected]);

    // Handle keyboard events for modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modalImage) {
                setModalImage(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalImage]);

    if (loading && !test) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-sm text-gray-400">Loading test results...</p>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <p className="mt-2 text-sm text-red-200">{error || 'Test not found'}</p>
            </div>
        );
    }

    const getGradeColor = (grade?: string) => {
        switch (grade) {
            case 'A': return 'text-green-300 bg-green-900';
            case 'B': return 'text-blue-300 bg-blue-900';
            case 'C': return 'text-yellow-300 bg-yellow-900';
            case 'D': return 'text-orange-300 bg-orange-900';
            case 'F': return 'text-red-300 bg-red-900';
            default: return 'text-gray-300 bg-gray-700';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-300 bg-red-900';
            case 'major': return 'text-orange-300 bg-orange-900';
            case 'minor': return 'text-yellow-300 bg-yellow-900';
            default: return 'text-gray-300 bg-gray-700';
        }
    };

    return (
        <div className="px-4 sm:px-0">
            {/* Image Modal */}
            {modalImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
                    onClick={() => setModalImage(null)}
                >
                    <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex flex-col">
                        {/* Close button */}
                        <button
                            onClick={() => setModalImage(null)}
                            className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 shadow-lg transition-colors border border-gray-600"
                            title="Close (or click outside)"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Image label */}
                        <div className="absolute top-4 left-4 z-10 bg-gray-900 bg-opacity-90 text-white px-4 py-2 rounded-lg border border-gray-700">
                            <p className="text-sm font-medium">{modalImage.label}</p>
                        </div>

                        {/* Image */}
                        <div className="flex-1 flex items-center justify-center">
                            <img
                                src={modalImage.src}
                                alt={modalImage.label}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Test Results</h1>
                    <p className="mt-1 text-sm text-gray-400 break-all">{test.gameUrl}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${test.status === 'completed' ? 'bg-green-900 text-green-300' :
                        test.status === 'running' ? 'bg-blue-900 text-blue-300' :
                            test.status === 'failed' ? 'bg-red-900 text-red-300' :
                                'bg-gray-700 text-gray-300'
                        }`}>
                        {test.status === 'running' && (
                            <span className="mr-2 inline-block animate-pulse">●</span>
                        )}
                        {test.status.toUpperCase()}
                    </span>
                </div>
            </div>

            {test.status === 'running' && (
                <div className="mt-6 bg-blue-900/50 border border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-blue-300">
                            Test is currently running...
                        </p>
                        {wsConnected && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                <span className="mr-1 inline-block animate-pulse">●</span>
                                Live Updates
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-blue-200">
                        Results will appear automatically as they are captured.
                    </p>
                </div>
            )}

            {/* Live Updates Feed */}
            {liveUpdates.length > 0 && (
                <div className="mt-6 bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
                    <h2 className="text-lg font-medium text-white mb-4">Live Activity Feed</h2>
                    <div className="space-y-3">
                        {liveUpdates.map((update, index) => (
                            <div
                                key={index}
                                className="flex gap-3 py-2 px-3 hover:bg-gray-700 rounded-lg transition-colors animate-fade-in"
                            >
                                {/* Screenshot thumbnail if available */}
                                {update.screenshot?.data && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={update.screenshot.data}
                                            alt={update.screenshot.label}
                                            className="w-32 h-20 object-cover rounded border border-gray-600 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                            onClick={() => setModalImage({ src: update.screenshot!.data!, label: update.screenshot!.label })}
                                            title="Click to view full size"
                                        />
                                    </div>
                                )}

                                {/* Message content */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-mono text-gray-400">
                                        <span className="text-gray-500">[{update.timestamp}]</span>{' '}
                                        <span className="text-gray-300">{update.message}</span>
                                    </div>
                                    {update.screenshot && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {update.screenshot.label}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Playability Score */}
            {test.playabilityScore !== null && test.playabilityScore !== undefined && (
                <div className="mt-6 bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
                    <h2 className="text-lg font-medium text-white mb-4">Playability Assessment</h2>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-white">{test.playabilityScore.toFixed(1)}</div>
                            <div className="text-sm text-gray-400 mt-1">Score</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getGradeColor(test.grade)}`}>
                                {test.grade || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">Grade</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{test.confidence?.toFixed(0)}%</div>
                            <div className="text-sm text-gray-400 mt-1">Confidence</div>
                        </div>
                    </div>

                    {test.scoreComponents && (
                        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                                <div className="text-sm font-medium text-gray-400">Visual</div>
                                <div className="mt-1 text-2xl font-semibold text-white">
                                    {test.scoreComponents.visual}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-400">Stability</div>
                                <div className="mt-1 text-2xl font-semibold text-white">
                                    {test.scoreComponents.stability}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-400">Interaction</div>
                                <div className="mt-1 text-2xl font-semibold text-white">
                                    {test.scoreComponents.interaction}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-400">Load</div>
                                <div className="mt-1 text-2xl font-semibold text-white">
                                    {test.scoreComponents.load}
                                </div>
                            </div>
                        </div>
                    )}

                    {test.reasoning && (
                        <div className="mt-4 p-4 bg-gray-900 rounded-md border border-gray-700">
                            <p className="text-sm text-gray-300">{test.reasoning}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Issues */}
            {test.issues && test.issues.length > 0 && (
                <div className="mt-6 bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
                    <h2 className="text-lg font-medium text-white mb-4">
                        Issues Detected ({test.issues.length})
                    </h2>
                    <div className="space-y-3">
                        {test.issues.map((issue) => (
                            <div key={issue.id} className="border-l-4 border-gray-600 pl-4 py-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                        {issue.severity.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-400">{issue.type}</span>
                                    <span className="text-xs text-gray-400">{issue.confidence}% confidence</span>
                                </div>
                                <p className="mt-1 text-sm text-gray-300">{issue.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div className="mt-6 bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-medium text-white mb-4">Test Metadata</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Test ID</dt>
                        <dd className="mt-1 text-sm text-white font-mono">{test.id}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Duration</dt>
                        <dd className="mt-1 text-sm text-white">
                            {test.duration ? `${(test.duration / 1000).toFixed(1)}s` : 'N/A'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Created At</dt>
                        <dd className="mt-1 text-sm text-white">
                            {new Date(test.createdAt).toLocaleString()}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

