import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';

export default function NewTestPage() {
    const navigate = useNavigate();
    const [gameUrl, setGameUrl] = useState('');
    const [timeout, setTimeout] = useState('120000');
    const [screenshotCount, setScreenshotCount] = useState('5');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post<{ testId: string; status: string; message: string }>('/api/test', {
                gameUrl,
                options: {
                    timeout: parseInt(timeout, 10),
                    screenshotCount: parseInt(screenshotCount, 10),
                },
            });

            if (response.error) {
                setError(response.error + ': ' + response.message);
                setLoading(false);
                return;
            }

            // Redirect to test results page
            if (response.data?.testId) {
                navigate(`/test/${response.data.testId}`);
            }
        } catch (err) {
            setError('Failed to submit test. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="px-4 sm:px-0">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Create New Test</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Submit a browser game URL for automated QA testing. The system will load the game,
                        analyze its playability, and generate a detailed report with screenshots and issue
                        detection.
                    </p>
                </div>
            </div>

            <div className="mt-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="gameUrl" className="block text-sm font-medium text-gray-900">
                            Game URL <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="url"
                                name="gameUrl"
                                id="gameUrl"
                                required
                                value={gameUrl}
                                onChange={(e) => setGameUrl(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                placeholder="https://example.com/my-game"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter the full URL of the browser game you want to test. Must start with http:// or https://
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="timeout" className="block text-sm font-medium text-gray-900">
                                Timeout (ms)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="timeout"
                                    id="timeout"
                                    min="10000"
                                    max="300000"
                                    step="1000"
                                    value={timeout}
                                    onChange={(e) => setTimeout(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Maximum test duration (default: 120000ms / 2 minutes)
                            </p>
                        </div>

                        <div>
                            <label htmlFor="screenshotCount" className="block text-sm font-medium text-gray-900">
                                Screenshot Count
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="screenshotCount"
                                    id="screenshotCount"
                                    min="1"
                                    max="10"
                                    value={screenshotCount}
                                    onChange={(e) => setScreenshotCount(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Number of screenshots to capture (default: 5)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-x-6">
                        <Link
                            to="/"
                            className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || !gameUrl}
                            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Test...' : 'Create Test'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                        <li>Browser automation loads your game URL</li>
                        <li>UI elements are detected and interactions are tested</li>
                        <li>Screenshots are captured at key moments</li>
                        <li>AI analyzes visual quality and stability</li>
                        <li>Detailed report is generated with playability score</li>
                    </ol>
                    <p className="mt-3 text-sm text-blue-700">
                        Average test duration: ~2 minutes
                    </p>
                </div>
            </div>
        </div>
    );
}

