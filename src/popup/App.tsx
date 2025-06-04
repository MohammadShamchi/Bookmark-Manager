import React, { useState, useEffect } from 'react';
import { Category } from '@/types';

interface ProcessingStatus {
    isProcessing: boolean;
    queueLength: number;
}

const App: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ isProcessing: false, queueLength: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load categories
            const categoriesResponse = await sendMessage({ type: 'GET_CATEGORIES' });
            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data);
            }

            // Load processing status
            const statusResponse = await sendMessage({ type: 'GET_PROCESSING_STATUS' });
            if (statusResponse.success) {
                setProcessingStatus(statusResponse.data);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = (message: any): Promise<any> => {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    };

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    <button
                        onClick={loadData}
                        className="mt-3 btn-secondary text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-popup">
            {/* Header */}
            <div className="bg-primary-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">🔖 AI Bookmark Manager</h1>
                        <p className="text-primary-100 text-sm">Intelligent bookmark organization</p>
                    </div>
                    {processingStatus.isProcessing && (
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span className="text-xs">Processing {processingStatus.queueLength}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Categories Grid */}
            <div className="p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3">Categories</h2>
                <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                        <div key={category.id} className="card hover:shadow-soft transition-shadow duration-200">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{category.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
                                    <p className="text-xs text-gray-500 truncate">{category.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Section */}
            <div className="px-4 pb-4">
                <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-organize</span>
                        <div className="flex items-center space-x-2">
                            {processingStatus.isProcessing ? (
                                <span className="text-xs text-orange-600 font-medium">Processing...</span>
                            ) : (
                                <span className="text-xs text-green-600 font-medium">Ready</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
                <div className="flex justify-between items-center">
                    <button
                        onClick={loadData}
                        className="btn-secondary text-sm"
                    >
                        Refresh
                    </button>
                    <button
                        className="btn-primary text-sm"
                        onClick={() => {
                            // Open options page or settings
                            console.log('Settings clicked');
                        }}
                    >
                        Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App; 