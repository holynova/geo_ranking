import { useState } from 'react'
import './App.css'

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <form
        className="w-full max-w-md bg-white rounded-lg shadow p-4 mb-4"
        onSubmit={handleQuery}
        aria-label="地址查询表单"
      >
        <label htmlFor="address" className="block text-sm font-medium mb-2">
          请输入中文地址：
        </label>
        <input
          id="address"
          type="text"
          className="w-full border rounded px-3 py-2 mb-2 focus:outline-none focus:ring"
          placeholder="如：北京市朝阳区团结湖"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
          aria-required="true"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? '查询中...' : '查询'}
        </button>
        {error && <div className="text-red-600 mt-2" role="alert">{error}</div>}
      </form>
      <div className="w-full max-w-md">
        {Object.keys(results).length > 0 && (
          <div className="space-y-6">
            {POI_CATEGORIES.map(({ label }) => (
              <div key={label}>
                <h2 className="text-lg font-semibold mb-2">{label}</h2>
                <ul className="space-y-2">
                  {results[label]?.length ? (
                    results[label].map((poi, idx) => (
                      <li
                        key={poi.name + idx}
                        className="bg-white rounded shadow p-3 flex flex-col"
                        tabIndex={0}
                        aria-label={`${poi.category}：${poi.name}`}
                      >
                        <div className="font-medium">{poi.name}</div>
                        <div className="text-sm text-gray-600">直线距离：{poi.distance}</div>
                        <div className="text-sm text-gray-600">驾车时间：{poi.drivingTime}</div>
                        <div className="text-sm text-gray-600">公交/地铁时间：{poi.transitTime}</div>
                        <div className="text-sm text-gray-600">电动车骑行时间：{poi.cyclingTime}</div>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">10公里内无结果</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      <footer className="mt-8 text-xs text-gray-400">数据来源：高德地图API</footer>
    </div>
  );
}

export default App
