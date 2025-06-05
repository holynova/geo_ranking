import { useState } from 'react'
import './App.css'
import ResultList from './components/ResultList/ResultList'
import './index.css'

interface PoiResult {
  category: string;
  name: string;
  location: string; // "lng,lat"
  distance: string; // e.g. "2.5公里"
  drivingTime: string; // e.g. "约15分钟"
  transitTime: string; // e.g. "约35分钟"
  cyclingTime: string; // e.g. "约20分钟"
}

const POI_CATEGORIES = [
  { label: '地铁站', code: '150500' },
  { label: '三甲医院', code: '090101' }, // fallback to 综合医院/医院 if needed
  { label: '图书馆', code: '140200' },
  { label: '博物馆', code: '140100' },
  { label: '公园', code: '110100' },
  { label: '美术馆', code: '140300' },
];

const AMapKey = import.meta.env.VITE_AMAP_KEY || ' Key请配置高德API';

function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PoiResult[]>>({});

  // Helper: fetch geocode
  async function fetchGeocode(addr: string): Promise<{ lng: string; lat: string; city: string }> {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(addr)}&output=JSON&key=${AMapKey}`
    );
    const data = await res.json();
    if (data.status !== '1' || !data.geocodes?.[0]) throw new Error('地址无法解析');
    const { location, city } = data.geocodes[0];
    const [lng, lat] = location.split(',');
    return { lng, lat, city: city || '' };
  }

  // Helper: fetch POIs for a category
  async function fetchPois(lng: string, lat: string, code: string, city: string, label: string): Promise<PoiResult[]> {
    const res = await fetch(
      `https://restapi.amap.com/v3/place/around?key=${AMapKey}&location=${lng},${lat}&types=${code}&radius=10000&offset=3&city=${encodeURIComponent(city)}&output=JSON&extensions=base&sortby=distance`
    );
    const data = await res.json();
    if (data.status !== '1' || !data.pois) return [];
    return data.pois.slice(0, 3).map((poi: any) => ({
      category: label,
      name: poi.name,
      location: poi.location,
      distance: '',
      drivingTime: '',
      transitTime: '',
      cyclingTime: '',
    }));
  }

  // Helper: fetch route info
  async function fetchRouteInfo(origin: string, destination: string, city: string) {
    // 直线距离
    const distRes = await fetch(
      `https://restapi.amap.com/v3/distance?key=${AMapKey}&origins=${origin}&destination=${destination}&type=0`
    );
    const distData = await distRes.json();
    let distance = '';
    if (distData.status === '1' && distData.results?.[0]) {
      const meters = Number(distData.results[0].distance);
      distance = meters >= 1000 ? `${(meters / 1000).toFixed(2)}公里` : `${meters}米`;
    }
    // 驾车
    const driveRes = await fetch(
      `https://restapi.amap.com/v3/direction/driving?key=${AMapKey}&origin=${origin}&destination=${destination}`
    );
    const driveData = await driveRes.json();
    let drivingTime = '';
    if (driveData.status === '1' && driveData.route?.paths?.[0]) {
      const sec = Number(driveData.route.paths[0].duration);
      drivingTime = sec >= 3600 ? `约${Math.round(sec / 3600)}小时` : `约${Math.round(sec / 60)}分钟`;
    }
    // 公交/地铁
    const transitRes = await fetch(
      `https://restapi.amap.com/v3/direction/transit/integrated?key=${AMapKey}&origin=${origin}&destination=${destination}&city=${encodeURIComponent(city)}`
    );
    const transitData = await transitRes.json();
    let transitTime = '';
    if (transitData.status === '1' && transitData.route?.transits?.[0]) {
      const sec = Number(transitData.route.transits[0].duration);
      transitTime = sec >= 3600 ? `约${Math.round(sec / 3600)}小时` : `约${Math.round(sec / 60)}分钟`;
    }
    // 骑行
    const cyclingRes = await fetch(
      `https://restapi.amap.com/v4/direction/bicycling?key=${AMapKey}&origin=${origin}&destination=${destination}`
    );
    const cyclingData = await cyclingRes.json();
    let cyclingTime = '';
    if (cyclingData.data?.paths?.[0]) {
      const sec = Number(cyclingData.data.paths[0].duration);
      cyclingTime = sec >= 3600 ? `约${Math.round(sec / 3600)}小时` : `约${Math.round(sec / 60)}分钟`;
    }
    return { distance, drivingTime, transitTime, cyclingTime };
  }

  // Main handler
  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults({});
    setLoading(true);
    try {
      // Step 1: 地址解析
      const { lng, lat, city } = await fetchGeocode(address);
      const origin = `${lng},${lat}`;
      // Step 2: POI 搜索
      const allResults: Record<string, PoiResult[]> = {};
      for (const { label, code } of POI_CATEGORIES) {
        let pois = await fetchPois(lng, lat, code, city, label);
        // 三甲医院特殊处理
        if (label === '三甲医院' && pois.length < 3) {
          const extra = await fetchPois(lng, lat, '090100', city, label); // 综合医院
          pois = [...pois, ...extra].slice(0, 3);
        }
        // Step 3: 路线信息
        for (let i = 0; i < pois.length; i++) {
          const poi = pois[i];
          const route = await fetchRouteInfo(origin, poi.location, city);
          pois[i] = { ...poi, ...route };
        }
        allResults[label] = pois;
      }
      setResults(allResults);
    } catch (err: any) {
      setError(err.message || '查询失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-cyan-100 to-blue-200 p-2 sm:p-4">
      {/* 顶部标题卡片 */}
      <div className="w-full max-w-xl rounded-2xl bg-white/80 shadow-lg p-6 mb-4 flex flex-col items-center border-2 border-green-200">
        <div className="flex items-center mb-2">
          <span className="text-3xl mr-2">🏙️</span>
          <span className="text-2xl font-bold text-green-700">地理位置便利性分析</span>
        </div>
        <div className="text-gray-600 text-center text-base">输入地址，快速了解周边生活设施和交通信息</div>
      </div>
      {/* 输入区卡片 */}
      <form
        className="w-full max-w-xl rounded-2xl bg-white/90 shadow-lg p-6 mb-6 border-2 border-green-100"
        onSubmit={handleQuery}
        aria-label="地址查询表单"
      >
        <label htmlFor="address" className="block text-lg font-bold text-green-700 mb-2 flex items-center">
          <span className="text-xl mr-2">📍</span>输入查询地址
        </label>
        <input
          id="address"
          type="text"
          className="w-full border-2 border-green-200 rounded-2xl px-4 py-3 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-50 placeholder-gray-400"
          placeholder="三里屯"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
          aria-required="true"
        />
        <button
          type="submit"
          className="w-full py-3 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-400 to-lime-400 text-white shadow-md hover:from-green-500 hover:to-lime-500 transition"
          disabled={loading}
        >
          {loading ? '分析中...' : '开始分析'}
        </button>
        {error && <div className="text-red-600 mt-2 text-sm" role="alert">{error}</div>}
      </form>
      {/* 结果展示区 */}
      <div className="w-full max-w-xl">
        {Object.keys(results).length > 0 && (
          <ResultList results={results} poiCategories={POI_CATEGORIES} />
        )}
      </div>
      <footer className="mt-8 text-xs text-gray-400">数据来源：高德地图API</footer>
    </div>
  );
}

export default App
