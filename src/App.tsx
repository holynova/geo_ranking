import React, { useState } from 'react'
import './App.css'
import ResultList from './components/ResultList/ResultList'
import type { PoiResult, PoiCategory } from './components/ResultList/ResultList'
import './index.css'

interface AmapPoi {
  id: string;
  name: string;
  location: string;
  address: string;
  distance: string;
}

interface AmapPlaceSearchResponse {
  status: string;
  info: string;
  pois: AmapPoi[];
}
interface AmapDistanceResponse {
  status: string;
  info: string;
  results: {
    distance: string;
  }[];
}

interface AmapDrivingResponse {
  status: string;
  info: string;
  route: {
    paths: {
      duration: string;
    }[];
  };
}

interface AmapTransitResponse {
  status: string;
  info: string;
  route: {
    transits: {
      duration: string;
    }[];
  };
}

interface AmapBicyclingResponse {
  errcode: number;
  errmsg: string;
  data: {
    paths: {
      duration: string;
    }[];
  };
}

const POI_CATEGORIES: PoiCategory[] = [
  { label: '地铁站', code: '150500' },
  { label: '三甲医院', code: '090101' }, // fallback to 综合医院/医院 if needed
  { label: '图书馆', code: '140500' },
  { label: '博物馆', code: '140200' },
  { label: '公园', code: '110101' },
  { label: '美术馆', code: '140300' },
];

const AMapKey = import.meta.env.VITE_AMAP_KEY || ' Key请配置高德API';

async function safeFetchAmap(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Amap API request failed with status:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Amap API request failed:', error);
    return null;
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PoiResult[]>>({});

  async function fetchPois(lng: string, lat: string, code: string): Promise<AmapPoi[]> {
    const poiUrl = `https://restapi.amap.com/v3/place/around?key=${AMapKey}&location=${lng},${lat}&types=${code}&radius=10000&offset=3&citylimit=true&output=JSON&extensions=all&sortby=distance&children=1`;
    const poiResp = await fetch(poiUrl);
    const poiData = (await poiResp.json()) as AmapPlaceSearchResponse;
    if (poiData.status === '1' && poiData.pois) {
      return poiData.pois;
    }
    return [];
  }

  async function fetchRouteInfo(origin: string, destination: string, city: string) {
    const distData = (await safeFetchAmap(
      `https://restapi.amap.com/v3/distance?key=${AMapKey}&origins=${origin}&destination=${destination}&type=0`,
    )) as AmapDistanceResponse | null;
    let distance = 'N/A';
    if (distData && distData.status === '1' && distData.results.length > 0) {
      distance = `${distData.results[0].distance}米`;
    }

    const driveUrl = `https://restapi.amap.com/v3/direction/driving?key=${AMapKey}&origin=${origin}&destination=${destination}&extensions=base`;
    const driveData = (await safeFetchAmap(driveUrl)) as AmapDrivingResponse;
    let drivingTime = 'N/A';
    if (driveData && driveData.status === '1' && driveData.route.paths.length > 0) {
      drivingTime = `${Math.round(parseInt(driveData.route.paths[0].duration, 10) / 60)}分钟`;
    }

    const transitUrl = `https://restapi.amap.com/v3/direction/transit/integrated?key=${AMapKey}&origin=${origin}&destination=${destination}&city=${encodeURIComponent(city)}&extensions=base`;
    const transitData = (await safeFetchAmap(transitUrl)) as AmapTransitResponse;
    let transitTime = 'N/A';
    if (transitData && transitData.status === '1' && transitData.route.transits.length > 0) {
      transitTime = `${Math.round(parseInt(transitData.route.transits[0].duration, 10) / 60)}分钟`;
    }

    const bicyclingUrl = `https://restapi.amap.com/v4/direction/bicycling?key=${AMapKey}&origin=${origin}&destination=${destination}`;
    const bicyclingData = (await safeFetchAmap(bicyclingUrl)) as AmapBicyclingResponse;
    let cyclingTime = 'N/A';
    if (bicyclingData && bicyclingData.errcode === 0 && bicyclingData.data.paths.length > 0) {
      cyclingTime = `${Math.round(parseInt(bicyclingData.data.paths[0].duration, 10) / 60)}分钟`;
    }

    return {
      distance,
      drivingTime,
      transitTime,
      cyclingTime,
    };
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError('请输入地址');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults({});

    try {
      const geoUrl = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&output=JSON&key=${AMapKey}`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();

      if (geoData.status !== '1' || !geoData.geocodes || geoData.geocodes.length === 0) {
        setError('无法找到地址，请尝试更精确的地址');
        setIsLoading(false);
        return;
      }

      const { location, city } = geoData.geocodes[0];
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 font-sans">
      <div className="w-full max-w-xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-600">Geo Ranking</h1>
          <p className="text-gray-500 mt-2">分析您关心地点周边的生活机能</p>
        </header>
        <form
          className="w-full max-w-xl rounded-2xl bg-white/90 shadow-lg p-6 mb-6 border-2 border-green-100"
          onSubmit={handleSearch}
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
          {Object.keys(results).length > 0 && <ResultList results={results} poiCategories={POI_CATEGORIES} />}
        </div>
        <footer className="mt-8 text-xs text-gray-400">数据来源：高德地图API</footer>
      </div>
    </div>
  );
}

export default App
