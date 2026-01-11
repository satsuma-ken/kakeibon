import { useState, useEffect } from 'react';
import { categoriesApi } from '../services/api';
import type { Category, TransactionType } from '../types';

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#78716C', // Stone
  '#737373', // Neutral
];

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as TransactionType,
    color: '#3B82F6',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('カテゴリの読み込みに失敗しました', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categoriesApi.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        type: 'expense',
        color: '#3B82F6',
      });
      loadCategories();
    } catch (error) {
      console.error('カテゴリの登録に失敗しました', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このカテゴリを削除してもよろしいですか?')) {
      try {
        await categoriesApi.delete(id);
        loadCategories();
      } catch (error) {
        console.error('カテゴリの削除に失敗しました', error);
      }
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">カテゴリ管理</h1>
          <p className="mt-2 text-sm text-gray-700">収入と支出のカテゴリを管理します</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            新規カテゴリ
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-green-50">
            <h3 className="text-lg font-medium text-gray-900">収入カテゴリ</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {incomeCategories.map((category) => (
                <li key={category.category_id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="h-10 w-10 rounded-full"
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      ></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(category.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(category.category_id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
              {incomeCategories.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  収入カテゴリが登録されていません
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-red-50">
            <h3 className="text-lg font-medium text-gray-900">支出カテゴリ</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {expenseCategories.map((category) => (
                <li key={category.category_id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="h-10 w-10 rounded-full"
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      ></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(category.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(category.category_id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
              {expenseCategories.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  支出カテゴリが登録されていません
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/50 transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">新規カテゴリの登録</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">カテゴリ名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="食費、給与など"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">種別</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="expense">支出</option>
                    <option value="income">収入</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
                  <div className="grid grid-cols-10 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-8 w-8 rounded-full transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">選択中:</span>
                    <div
                      className="h-6 w-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-xs font-mono text-gray-600">{formData.color}</span>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    登録
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
