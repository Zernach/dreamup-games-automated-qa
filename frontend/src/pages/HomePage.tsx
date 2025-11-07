import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { gamePresets, GamePreset } from '@/data/gamePresets';
import GameCard from '@/components/GameCard';
import logo from '@/assets/dreamup-logo.png';

export default function HomePage() {
    const navigate = useNavigate();
    const [testingGameId, setTestingGameId] = useState<string | null>(null);

    // Custom URL form state
    const [gameUrl, setGameUrl] = useState('');
    const [timeout, setTimeout] = useState('180000');
    const [screenshotCount, setScreenshotCount] = useState('50');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleGameSelect = async (game: GamePreset) => {
        setTestingGameId(game.id);
        setError('');

        try {
            const response = await apiClient.post<{ testId: string; status: string; message: string }>('/api/test', {
                gameUrl: game.url,
                options: {
                    timeout: parseInt(timeout, 10),
                    screenshotCount: parseInt(screenshotCount, 10),
                },
            });

            if (response.error) {
                setError(response.error + ': ' + response.message);
                setTestingGameId(null);
                return;
            }

            // Redirect to test results page
            if (response.data?.testId) {
                navigate(`/test/${response.data.testId}`);
            }
        } catch (err) {
            setError('Failed to start test. Please try again.');
            setTestingGameId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
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
                setSubmitting(false);
                return;
            }

            // Redirect to test results page
            if (response.data?.testId) {
                navigate(`/test/${response.data.testId}`);
            }
        } catch (err) {
            setError('Failed to submit test. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-700 rounded-lg p-12">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <img
                            src={logo}
                            alt="DreamUp Games"
                            className="h-40 w-40 object-contain"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        Welcome to DreamUp Games QA
                    </h2>
                    <p className="mt-4 text-lg text-gray-400">
                        AI-powered automated quality assurance for browser games
                    </p>
                </div>
            </div>

            {/* Game Selection Grid */}
            <div className="mt-12">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="sm:flex-auto">
                        <h2 className="text-2xl font-semibold text-white">Quick Test Games</h2>
                        <p className="mt-2 text-sm text-gray-400">
                            Select a popular game to test instantly, or enter a custom URL below
                        </p>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {gamePresets.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            onSelect={handleGameSelect}
                            loading={testingGameId === game.id}
                        />
                    ))}
                </div>
            </div>

            {/* Custom URL Form */}
            <div className="mt-12">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-gray-900 px-3 text-sm text-gray-400">Or enter a custom URL</span>
                    </div>
                </div>

                <div className="mt-8 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 shadow-sm ring-1 ring-gray-700 sm:rounded-xl p-6">
                            {error && (
                                <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-300">Error</h3>
                                            <div className="mt-2 text-sm text-red-200">{error}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="gameUrl" className="block text-sm font-medium text-gray-200">
                                    Game URL <span className="text-red-400">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="url"
                                        name="gameUrl"
                                        id="gameUrl"
                                        required
                                        value={gameUrl}
                                        onChange={(e) => setGameUrl(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 px-3 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                                        placeholder="https://example.com/my-game"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-400">
                                    Enter the full URL of the browser game you want to test
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="timeout" className="block text-sm font-medium text-gray-200">
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
                                            className="block w-full rounded-md border-0 py-1.5 px-3 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-400">
                                        Maximum test duration (default: 180000ms)
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="screenshotCount" className="block text-sm font-medium text-gray-200">
                                        Screenshot Count
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="number"
                                            name="screenshotCount"
                                            id="screenshotCount"
                                            min="1"
                                            max="50"
                                            value={screenshotCount}
                                            onChange={(e) => setScreenshotCount(e.target.value)}
                                            className="block w-full rounded-md border-0 py-1.5 px-3 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-400">
                                        Number of screenshots to capture (default: 20)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting || !gameUrl}
                                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating Test...' : 'Create Test'}
                                </button>
                            </div>
                        </form>

                        <div className="bg-blue-900/50 border border-blue-800 rounded-lg p-6 h-fit">
                            <h3 className="text-sm font-medium text-blue-300 mb-2">What happens next?</h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200">
                                <li>Browser automation loads your game URL</li>
                                <li>UI elements are detected and interactions are tested</li>
                                <li>Screenshots are captured at key moments</li>
                                <li>AI analyzes visual quality and stability</li>
                                <li>Detailed report is generated with playability score</li>
                            </ol>
                            <p className="mt-3 text-sm text-blue-200">
                                Average test duration: ~3-5 minutes
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

