import { useState } from 'react';
import type { PoiCategory, PoiResult } from '../types/amap';
import { fetchPois, fetchRouteInfo, delay, fetchGeocode } from '../services/amap';

export const POI_CATEGORIES: PoiCategory[] = [
  { label: '地铁站', code: '150500' },
  { label: '三甲医院', code: '090101' },
  { label: '图书馆', code: '140500' },
  { label: '博物馆', code: '140200' },
  { label: '公园', code: '110101' },
  { label: '美术馆', code: '140300' },
];

export function useAmapSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PoiResult[]>>({});

  const handleSearch = async (address: string) => {
    if (!address) {
      setError('请输入地址');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults({});

    try {
      const geoData = await fetchGeocode(address);

      if (geoData.status !== '1' || !geoData.geocodes || geoData.geocodes.length === 0) {
        setError('无法找到地址，请尝试更精确的地址');
        setIsLoading(false);
        return;
      }

      const { location, city } = geoData.geocodes[0];
      if (typeof city !== 'string' || !city) {
        setError('无法确定地址所在城市');
        setIsLoading(false);
        return;
      }
      const [lng, lat] = location.split(',');

      const poiPromises = POI_CATEGORIES.map(async (category) => {
        const pois = await fetchPois(lng, lat, category.code);
        const detailedPois: PoiResult[] = [];

        if (pois.length > 0) {
          for (const poi of pois) {
            const routeInfo = await fetchRouteInfo(`${lng},${lat}`, poi.location, city);
            detailedPois.push({
              category: category.label,
              name: poi.name,
              location: poi.address,
              ...routeInfo,
            });
            await delay(250);
          }
        }
        return { [category.label]: detailedPois };
      });

      const resultsArray = await Promise.all(poiPromises);
      const newResults = resultsArray.reduce((acc, current) => ({ ...acc, ...current }), {});

      setResults(newResults);
    } catch (err) {
      console.error('An error occurred during search:', err);
      setError('搜索过程中发生错误，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    results,
    handleSearch,
  };
} 