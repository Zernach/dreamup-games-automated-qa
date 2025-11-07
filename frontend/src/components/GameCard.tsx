import { GamePreset } from '@/data/gamePresets';
import { useState } from 'react';

interface GameCardProps {
    game: GamePreset;
    onSelect: (game: GamePreset) => void;
    loading?: boolean;
}

export default function GameCard({ game, onSelect, loading = false }: GameCardProps) {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [iframeError, setIframeError] = useState(false);

    const categoryColors: Record<GamePreset['category'], string> = {
        puzzle: 'bg-purple-900 text-purple-300',
        action: 'bg-red-900 text-red-300',
        multiplayer: 'bg-blue-900 text-blue-300',
        casual: 'bg-green-900 text-green-300',
        platformer: 'bg-yellow-900 text-yellow-300',
        idle: 'bg-gray-700 text-gray-300',
        broken: 'bg-red-950 text-red-400',
        rpg: 'bg-indigo-900 text-indigo-300',
    };

    return (
        <button
            onClick={() => onSelect(game)}
            disabled={loading}
            className="group relative bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-700 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
            {/* Live Game Preview (iframe) */}
            <div className="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden relative">
                {!iframeError ? (
                    <>
                        {/* Loading skeleton */}
                        {!iframeLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                <div className="animate-pulse text-gray-600">
                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* iframe preview */}
                        <iframe
                            src={game.url}
                            title={game.name}
                            className={`w-full h-full border-0 pointer-events-none scale-100 origin-top-left ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                            sandbox="allow-scripts allow-same-origin"
                            loading="lazy"
                            onLoad={() => setIframeLoaded(true)}
                            onError={() => {
                                setIframeError(true);
                                setIframeLoaded(false);
                            }}
                        />

                        {/* Overlay to prevent iframe interaction */}
                        <div className="absolute inset-0 bg-transparent cursor-pointer" />
                    </>
                ) : (
                    // Fallback icon if iframe fails to load
                    <div className="flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 bg-gray-800 relative z-10">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">
                        {game.name}
                    </h3>
                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${categoryColors[game.category]}`}>
                        {game.category}
                    </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{game.description}</p>
            </div>

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-sm text-gray-300">Starting test...</p>
                </div>
            )}
        </button>
    );
}

