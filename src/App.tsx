import React, { useState } from 'react';
import './App.css';
import ResultList from './components/ResultList/ResultList';
import './index.css';
import { useAmapSearch, POI_CATEGORIES } from './hooks/useAmapSearch';

const DEFAULT_CATEGORIES = ['地铁站', '三甲医院'];

const App: React.FC = () => {
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const { isLoading, error, results, handleSearch } = useAmapSearch();

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categories = POI_CATEGORIES.filter(cat => selectedCategories.includes(cat.label));
    handleSearch(address, categories);
  };

  const handleCategoryChange = (label: string) => {
    setSelectedCategories(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const filteredCategories = POI_CATEGORIES.filter(cat => selectedCategories.includes(cat.label));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 font-sans">
      <div className="w-full max-w-xl">
        <header className="text-center mb-8">
          <h1 className="text-xl font-bold text-green-600">Geo Ranking</h1>
          <p className="text-gray-500 mt-2">分析您关心地点周边的生活机能</p>
        </header>
        <section className="mb-4 rounded-xl bg-white/80 shadow p-4 border border-green-100">
          <div className="font-semibold text-green-700 mb-2">功能开关设置：</div>
          <div className="flex flex-wrap gap-4">
            {POI_CATEGORIES.map(cat => (
              <label key={cat.label} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.label)}
                  onChange={() => handleCategoryChange(cat.label)}
                  className="accent-green-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700">{cat.label}</span>
              </label>
            ))}
          </div>
        </section>
        <form
          className="w-full max-w-xl rounded-2xl bg-white/90 shadow-lg p-6 mb-6 border-2 border-green-100"
          onSubmit={onFormSubmit}
          aria-label="地址查询表单"
        >
          <label htmlFor="address" className="block text-lg font-bold text-green-700 mb-2 flex items-center">
            <span className="text-xl mr-2">📍</span>输入查询地址
          </label>
          <input
            id="address"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            placeholder="例如：北京市朝阳区三里屯"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            aria-required="true"
          />
          <button
            type="submit"
            className="w-full mt-4 py-3 text-lg font-bold rounded-xl bg-gradient-to-r from-green-400 to-lime-400 text-white shadow-md hover:from-green-500 hover:to-lime-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? '分析中...' : '开始分析'}
          </button>
          {error && <div className="text-red-600 mt-2 text-sm" role="alert">{error}</div>}
        </form>
        <div className="w-full max-w-xl">
          {Object.keys(results).length > 0 && <ResultList results={results} poiCategories={filteredCategories} />}
        </div>
        <footer className="mt-8 text-xs text-gray-400">数据来源：高德地图API</footer>
      </div>
    </div>
  );
};

export default App;
