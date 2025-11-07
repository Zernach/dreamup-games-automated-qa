import { useState } from 'react';

interface CollapsibleHtmlProps {
    html: string;
    label?: string;
    className?: string;
}

export default function CollapsibleHtml({ html, label = 'HTML DOM', className = '' }: CollapsibleHtmlProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Format HTML for better readability
    const formatHtml = (htmlString: string): string => {
        try {
            // Basic formatting: add line breaks after closing tags
            return htmlString
                .replace(/></g, '>\n<')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('\n');
        } catch (error) {
            console.error('Error formatting HTML:', error);
            return htmlString;
        }
    };

    const formattedHtml = formatHtml(html);
    const lineCount = formattedHtml.split('\n').length;
    const charCount = html.length;

    return (
        <div className={`border border-gray-600 rounded-lg overflow-hidden ${className}`}>
            {/* Header with expand/collapse button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-750 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs font-medium text-gray-300">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                        {lineCount.toLocaleString()} lines · {(charCount / 1024).toFixed(1)}KB
                    </span>
                    <span className="text-xs text-gray-400">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                </div>
            </button>

            {/* Collapsible content */}
            {isExpanded && (
                <div className="bg-gray-900 border-t border-gray-700">
                    <div className="max-h-96 overflow-auto">
                        <pre className="p-3 text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
                            <code>{formattedHtml}</code>
                        </pre>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-gray-700 px-3 py-2 bg-gray-850 flex gap-2">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(html);
                            }}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                        >
                            Copy HTML
                        </button>
                        <button
                            onClick={() => {
                                const blob = new Blob([html], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `dom-${Date.now()}.html`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                        >
                            Download HTML
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

