import React from 'react';
import type { PoiResult, PoiCategory } from '../../types/amap';

const CATEGORY_ICONS: Record<string, string> = {
  '地铁站': '🚇',
  '三甲医院': '🏥',
  '图书馆': '📚',
  '博物馆': '🏛️',
  '公园': '🏞️',
  '美术馆': '🖼️',
};

interface ResultListProps {
  results: Record<string, PoiResult[]>;
  poiCategories: PoiCategory[];
}

const ResultList: React.FC<ResultListProps> = ({ results, poiCategories }) => {
  return (
    <div className="space-y-6">
      {poiCategories.map(({ label }) => (
        <section
          key={label}
          aria-labelledby={`poi-group-${label}`}
          className="rounded-2xl bg-white/90 shadow-lg border-2 border-green-100 p-4 mb-4"
        >
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">{CATEGORY_ICONS[label] || '📍'}</span>
            <h2 id={`poi-group-${label}`} className="text-xl font-bold text-green-700">
              {label}
            </h2>
          </div>

          {/* Responsive container */}
          <div>
            {/* Table Header for small screens and up */}
            <div className="hidden sm:flex flex-row bg-green-100/50 rounded-t-lg">
              <div className="p-3 text-left text-sm font-semibold text-green-800 w-1/3">名称</div>
              <div className="p-3 text-left text-sm font-semibold text-green-800 w-1/6">
                <span className="mr-1 hidden lg:inline">✏️</span>直线距离
              </div>
              <div className="p-3 text-left text-sm font-semibold text-green-800 w-1/6">
                <span className="mr-1 hidden lg:inline">🚗</span>驾车
              </div>
              <div className="p-3 text-left text-sm font-semibold text-green-800 w-1/6">
                <span className="mr-1 hidden lg:inline">🚌</span>公交
              </div>
              <div className="p-3 text-left text-sm font-semibold text-green-800 w-1/6">
                <span className="mr-1 hidden lg:inline">🚴‍♂️</span>骑行
              </div>
            </div>

            {/* Results List */}
            <div className="sm:border-t-0">
              {results[label]?.length ? (
                results[label].map((poi, idx) => (
                  <div
                    key={poi.name + idx}
                    className="flex flex-col sm:flex-row sm:items-center py-4 px-2 sm:p-0 border-b border-green-100 hover:bg-green-50/80 transition-colors duration-150"
                  >
                    <div className="sm:w-1/3 sm:p-3 text-base text-gray-800 font-medium">{poi.name}</div>

                    <div className="flex flex-row items-center pt-2 sm:pt-0 sm:w-1/6 sm:p-3">
                      <span className="sm:hidden text-sm font-semibold text-gray-600 w-24">✏️ 直线距离:</span>
                      <span className="text-base text-gray-700">{poi.distance}</span>
                    </div>

                    <div className="flex flex-row items-center pt-1 sm:pt-0 sm:w-1/6 sm:p-3">
                      <span className="sm:hidden text-sm font-semibold text-gray-600 w-24">🚗 驾车:</span>
                      <span className="text-base text-gray-700">{poi.drivingTime}</span>
                    </div>

                    <div className="flex flex-row items-center pt-1 sm:pt-0 sm:w-1/6 sm:p-3">
                      <span className="sm:hidden text-sm font-semibold text-gray-600 w-24">🚌 公交:</span>
                      <span className="text-base text-gray-700">{poi.transitTime}</span>
                    </div>

                    <div className="flex flex-row items-center pt-1 sm:pt-0 sm:w-1/6 sm:p-3">
                      <span className="sm:hidden text-sm font-semibold text-gray-600 w-24">🚴‍♂️ 骑行:</span>
                      <span className="text-base text-gray-700">{poi.cyclingTime}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">10公里内无结果</div>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default ResultList; 