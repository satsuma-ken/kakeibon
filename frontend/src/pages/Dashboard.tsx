import { useState, useEffect } from 'react';
import { transactionsApi, categoriesApi } from '../services/api';
import type { Transaction, Category, TransactionType } from '../types';
import { RecurringCategoryBanner } from '../components/RecurringCategoryBanner';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionFormData, setTransactionFormData] = useState({
    category_id: '',
    amount: '',
    type: 'expense' as TransactionType,
    date: new Date().toISOString().split('T')[0],
    memo: '',
  });
  const [bannerKey, setBannerKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        transactionsApi.getAll({
          start_date: `${selectedMonth}-01`,
          end_date: `${selectedMonth}-31`,
        }),
        categoriesApi.getAll(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      showErrorToast(error, 'データの読み込みに失敗しました');
    } finally{
      setIsLoading(false);
    }
  };

  const handleRegisterRecurring = (category: Category) => {
    setTransactionFormData({
      category_id: category.category_id,
      amount: category.default_amount?.toString() || '',
      type: category.type,
      date: new Date().toISOString().split('T')[0],
      memo: '',
    });
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsApi.create({
        ...transactionFormData,
        amount: parseInt(transactionFormData.amount),
      });
      setShowTransactionModal(false);
      setTransactionFormData({
        category_id: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        memo: '',
      });
      loadData(); // ダッシュボードをリロード
      setBannerKey(prev => prev + 1); // バナーをリフレッシュ
      showSuccessToast('取引を登録しました');
    } catch (error) {
      showErrorToast(error, '取引の作成に失敗しました');
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.category_id === categoryId);
    return category ? category.name : '不明';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.category_id === categoryId);
    return category?.color || '#3B82F6';
  };

  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = getCategoryName(t.category_id);
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-700">収支の概要を確認します</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <RecurringCategoryBanner key={bannerKey} onRegister={handleRegisterRecurring} />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">収入</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatCurrency(totalIncome)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-red-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">支出</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatCurrency(totalExpense)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-md ${balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'} p-3`}>
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">収支</dt>
                  <dd className={`text-lg font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(balance)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">カテゴリ別支出</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {Object.keys(expenseByCategory).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(expenseByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = (amount / totalExpense) * 100;
                    const categoryData = categories.find((c) => c.name === category);
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center">
                            <div
                              className="h-3 w-3 rounded-full mr-2"
                              style={{ backgroundColor: categoryData?.color || '#3B82F6' }}
                            ></div>
                            <span className="font-medium text-gray-900">{category}</span>
                          </div>
                          <span className="text-gray-500">
                            {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: categoryData?.color || '#3B82F6',
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">支出データがありません</div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">最近の取引</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.transaction_id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div
                        className="h-10 w-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(transaction.category_id) }}
                      ></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {getCategoryName(transaction.category_id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.memo && (
                        <p className="text-xs text-gray-500">{transaction.memo}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">取引データがありません</div>
            )}
          </div>
        </div>
      </div>

      {/* 取引登録モーダル */}
      {showTransactionModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/50 transition-opacity" onClick={() => setShowTransactionModal(false)}></div>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">取引の登録</h3>
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
                  <select
                    value={transactionFormData.category_id}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, category_id: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">カテゴリを選択</option>
                    {categories
                      .filter((c) => c.type === transactionFormData.type)
                      .map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">金額</label>
                  <input
                    type="number"
                    value={transactionFormData.amount}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">種別</label>
                  <select
                    value={transactionFormData.type}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, type: e.target.value as TransactionType, category_id: '' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="expense">支出</option>
                    <option value="income">収入</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">日付</label>
                  <input
                    type="date"
                    value={transactionFormData.date}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">メモ（任意）</label>
                  <textarea
                    value={transactionFormData.memo}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, memo: e.target.value })}
                    rows={3}
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
                    onClick={() => setShowTransactionModal(false)}
                    className="mt-3 sm:mt-0 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
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
