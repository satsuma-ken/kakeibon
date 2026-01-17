import { useState, useEffect } from 'react';
import { budgetsApi, categoriesApi, transactionsApi } from '../services/api';
import type { Budget, Category, Transaction } from '../types';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

export const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7),
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        budgetsApi.getAll({ month: `${selectedMonth}-01` }),
        categoriesApi.getAll(),
        transactionsApi.getAll({
          start_date: `${selectedMonth}-01`,
          end_date: `${selectedMonth}-31`,
        }),
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
    } catch (error) {
      showErrorToast(error, 'データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await budgetsApi.create({
        ...formData,
        amount: parseInt(formData.amount),
        month: `${formData.month}-01`,
      });
      setShowModal(false);
      setFormData({
        category_id: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
      });
      loadData();
      showSuccessToast('予算を設定しました');
    } catch (error) {
      showErrorToast(error, '予算の登録に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('この予算を削除してもよろしいですか?')) {
      try {
        await budgetsApi.delete(id);
        loadData();
        showSuccessToast('予算を削除しました');
      } catch (error) {
        showErrorToast(error, '予算の削除に失敗しました');
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.category_id === categoryId);
    return category ? category.name : '不明';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.category_id === categoryId);
    return category?.color || '#3B82F6';
  };

  const getSpentAmount = (categoryId: string) => {
    return transactions
      .filter((t) => t.category_id === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">予算管理</h1>
          <p className="mt-2 text-sm text-gray-700">月ごとの予算を設定し、支出を管理します</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4 flex items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            新規予算
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const spent = getSpentAmount(budget.category_id);
          const percentage = (spent / budget.amount) * 100;

          return (
            <div key={budget.budget_id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{ backgroundColor: getCategoryColor(budget.category_id) }}
                    ></div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getCategoryName(budget.category_id)}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(budget.budget_id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    削除
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">予算</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">使用額</span>
                    <span className={`font-medium ${percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(spent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">残り</span>
                    <span className={`font-medium ${budget.amount - spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budget.amount - spent)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>進捗</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(spent, budget.amount)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {budgets.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            この月の予算が設定されていません
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/50 transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">新規予算の設定</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">選択してください</option>
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">予算額</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">対象月</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
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
