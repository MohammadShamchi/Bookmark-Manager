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

            // Load categories with retry logic
            const categoriesResponse = await sendMessageWithRetry({ type: 'GET_CATEGORIES' });
            if (categoriesResponse?.success) {
                setCategories(categoriesResponse.data || []);
            }

            // Load processing status with retry logic
            const statusResponse = await sendMessageWithRetry({ type: 'GET_PROCESSING_STATUS' });
            if (statusResponse?.success) {
                setProcessingStatus(statusResponse.data || { isProcessing: false, queueLength: 0 });
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
            console.warn('Failed to load popup data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = (message: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!chrome?.runtime?.sendMessage) {
                reject(new Error('Chrome runtime not available'));
                return;
            }

            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    // Clear the error and reject
                    const error = chrome.runtime.lastError;
                    console.warn('Chrome runtime error:', error.message);
                    reject(new Error(error.message || 'Failed to communicate with background script'));
                    return;
                }
                resolve(response);
            });
        });
    };

    const sendMessageWithRetry = async (message: any, maxRetries: number = 3): Promise<any> => {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Add a small delay for subsequent attempts
                if (attempt > 1) {
                    await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                }

                const response = await sendMessage(message);
                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.warn(`Message attempt ${attempt}/${maxRetries} failed:`, lastError.message);

                // If it's the last attempt, don't continue
                if (attempt === maxRetries) {
                    break;
                }
            }
        }

        // If we get here, all attempts failed
        console.error('All message attempts failed, falling back to defaults');

        // Return sensible defaults instead of throwing
        if (message.type === 'GET_CATEGORIES') {
            return {
                success: true,
                data: [
                    { id: 'work', name: 'Work', emoji: '💼', description: 'Professional tools, business, productivity' },
                    { id: 'social', name: 'Social', emoji: '👥', description: 'Social media, forums, communities' },
                    { id: 'news', name: 'News', emoji: '📰', description: 'News sites, blogs, journalism' },
                    { id: 'tools', name: 'Tools', emoji: '🛠️', description: 'Development tools, utilities' },
                    { id: 'learning', name: 'Learning', emoji: '📚', description: 'Education, tutorials, courses' },
                    { id: 'shopping', name: 'Shopping', emoji: '🛒', description: 'E-commerce, products, deals' },
                    { id: 'entertainment', name: 'Entertainment', emoji: '🎮', description: 'Games, videos, music' },
                    { id: 'finance', name: 'Finance', emoji: '💰', description: 'Banking, investing, crypto' },
                    { id: 'health', name: 'Health', emoji: '🏥', description: 'Medical, fitness, wellness' },
                    { id: 'other', name: 'Other', emoji: '📂', description: 'Everything else' }
                ]
            };
        }

        if (message.type === 'GET_PROCESSING_STATUS') {
            return {
                success: true,
                data: { isProcessing: false, queueLength: 0 }
            };
        }

        throw lastError || new Error('Failed to communicate with background script');
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