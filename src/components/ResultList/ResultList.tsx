import React from 'react';

export interface PoiResult {
  category: string;
  name: string;
  location: string;
  distance: string;
  drivingTime: string;
  transitTime: string;
  cyclingTime: string;
}

export interface PoiCategory {
  label: string;
  code: string;
}

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
          <ul className="space-y-4">
            {results[label]?.length ? (
              results[label].map((poi, idx) => (
                <li
                  key={poi.name + idx}
                  className="rounded-xl bg-green-50 border border-green-100 shadow p-4 flex flex-col mb-2"
                  tabIndex={0}
                  aria-label={`${poi.category}：${poi.name}`}
                >
                  <div className="font-bold text-green-800 text-lg mb-2">{poi.name}</div>
                  <div className="flex flex-col gap-1 text-base text-gray-700">
                    <div><span className="mr-1">✏️</span>直线距离: {poi.distance}</div>
                    <div><span className="mr-1">🚗</span>驾车: {poi.drivingTime}</div>
                    <div><span className="mr-1">🚌</span>公交: {poi.transitTime}</div>
                    <div><span className="mr-1">🚴‍♂️</span>骑行: {poi.cyclingTime}</div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-400">10公里内无结果</li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default ResultList; 