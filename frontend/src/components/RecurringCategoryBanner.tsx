import { useState, useEffect } from 'react';
import { categoriesApi } from '../services/api';
import type { Category } from '../types';
import { showErrorToast } from '../utils/errorHandler';

interface RecurringCategoryBannerProps {
  onRegister: (category: Category) => void;
}

export const RecurringCategoryBanner = ({ onRegister }: RecurringCategoryBannerProps) => {
  const [unregisteredCategories, setUnregisteredCategories] = useState<Category[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnregisteredCategories();
  }, []);

  const loadUnregisteredCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getUnregisteredRecurring();
      setUnregisteredCategories(data);
    } catch (err) {
      setError('未登録固定費の取得に失敗しました');
      showErrorToast(err, '未登録固定費の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
          <button
            onClick={loadUnregisteredCategories}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
          >
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!isVisible || unregisteredCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700 font-medium">
            未登録の固定費があります ({unregisteredCategories.length}件)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unregisteredCategories.map((category) => (
              <button
                key={category.category_id}
                onClick={() => onRegister(category)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:shadow-md transition-all duration-200 border border-yellow-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                <div
                  className="h-3 w-3 rounded-full mr-2"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                />
                {category.name}
                <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="inline-flex text-yellow-400 hover:text-yellow-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
