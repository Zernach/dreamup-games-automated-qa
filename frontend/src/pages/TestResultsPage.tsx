import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';

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
        filePath: string;
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

export default function TestResultsPage() {
    const { id: testId } = useParams<{ id: string }>();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [polling, setPolling] = useState(true);

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

        fetchTest();

        // Poll every 3 seconds while test is running
        let interval: NodeJS.Timeout;
        if (polling) {
            interval = setInterval(fetchTest, 3001);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [testId, polling]);

    if (loading && !test) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading test results...</p>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="rounded-md bg-red-50 p-4">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error || 'Test not found'}</p>
            </div>
        );
    }

    const getGradeColor = (grade?: string) => {
        switch (grade) {
            case 'A': return 'text-green-700 bg-green-100';
            case 'B': return 'text-blue-700 bg-blue-100';
            case 'C': return 'text-yellow-700 bg-yellow-100';
            case 'D': return 'text-orange-700 bg-orange-100';
            case 'F': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-700 bg-red-100';
            case 'major': return 'text-orange-700 bg-orange-100';
            case 'minor': return 'text-yellow-700 bg-yellow-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    return (
        <div className="px-4 sm:px-0">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Test Results</h1>
                    <p className="mt-1 text-sm text-gray-500 break-all">{test.gameUrl}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${test.status === 'completed' ? 'bg-green-100 text-green-800' :
                        test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            test.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {test.status === 'running' && (
                            <span className="mr-2 inline-block animate-pulse">●</span>
                        )}
                        {test.status.toUpperCase()}
                    </span>
                </div>
            </div>

            {test.status === 'running' && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                        Test is currently running... Results will appear automatically when complete.
                    </p>
                </div>
            )}

            {/* Playability Score */}
            {test.playabilityScore !== null && test.playabilityScore !== undefined && (
                <div className="mt-6 bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Playability Assessment</h2>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-gray-900">{test.playabilityScore.toFixed(1)}</div>
                            <div className="text-sm text-gray-500 mt-1">Score</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getGradeColor(test.grade)}`}>
                                {test.grade || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Grade</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">{test.confidence?.toFixed(0)}%</div>
                            <div className="text-sm text-gray-500 mt-1">Confidence</div>
                        </div>
                    </div>

                    {test.scoreComponents && (
                        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Visual</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">
                                    {test.scoreComponents.visual}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Stability</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">
                                    {test.scoreComponents.stability}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Interaction</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">
                                    {test.scoreComponents.interaction}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Load</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">
                                    {test.scoreComponents.load}
                                </div>
                            </div>
                        </div>
                    )}

                    {test.reasoning && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">{test.reasoning}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Screenshots */}
            {test.screenshots && test.screenshots.length > 0 && (
                <div className="mt-6 bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Screenshots</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {test.screenshots.map((screenshot) => (
                            <div key={screenshot.id} className="border rounded-lg p-2">
                                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-sm text-gray-500">{screenshot.label}</span>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">{screenshot.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Issues */}
            {test.issues && test.issues.length > 0 && (
                <div className="mt-6 bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Issues Detected ({test.issues.length})
                    </h2>
                    <div className="space-y-3">
                        {test.issues.map((issue) => (
                            <div key={issue.id} className="border-l-4 border-gray-300 pl-4 py-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                        {issue.severity.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">{issue.type}</span>
                                    <span className="text-xs text-gray-500">{issue.confidence}% confidence</span>
                                </div>
                                <p className="mt-1 text-sm text-gray-700">{issue.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Test Metadata</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Test ID</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">{test.id}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Duration</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                            {test.duration ? `${(test.duration / 1000).toFixed(1)}s` : 'N/A'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Created At</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                            {new Date(test.createdAt).toLocaleString()}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

