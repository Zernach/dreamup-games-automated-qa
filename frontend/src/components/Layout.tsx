import { Link } from 'react-router-dom';
import logo from '@/assets/dreamup-logo.png';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-900">
            <nav className="bg-gray-800 shadow-sm border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <img
                                    src={logo}
                                    alt="DreamUp Games"
                                    className="h-10 w-10 object-contain"
                                />
                                <h1 className="text-xl font-bold text-white">
                                    DreamUp Games QA
                                </h1>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}

