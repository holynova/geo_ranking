import type {
  AmapPlaceSearchResponse,
  AmapPoi,
  AmapDistanceResponse,
  AmapDrivingResponse,
  AmapTransitResponse,
  AmapBicyclingResponse,
  AmapGeocodeResponse,
} from '../types/amap';

const AMapKey = import.meta.env.VITE_AMAP_KEY || 'Key请配置高德API';

class RequestQueue {
  private queue: (() => Promise<unknown>)[] = [];
  private processing: number = 0;
  private maxConcurrent: number;
  private delayMs: number;
  private lastRequestTime: number = 0;

  constructor(maxConcurrent: number = 3, delayMs: number = 200) {
    this.maxConcurrent = maxConcurrent;
    this.delayMs = delayMs;
  }

  public add<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(() =>
        (async () => {
          try {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.delayMs) {
              await delay(this.delayMs - timeSinceLastRequest);
            }
            this.lastRequestTime = Date.now();
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            resolve(data as T);
          } catch (error) {
            reject(error);
          }
        })()
      );
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const request = this.queue.shift();

    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Request failed in queue:', error);
      } finally {
        this.processing--;
        this.processQueue();
      }
    }
  }
}

const amapRequestQueue = new RequestQueue();

export async function fetchGeocode(address: string): Promise<AmapGeocodeResponse> {
  const geoUrl = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&output=JSON&key=${AMapKey}`;
  return amapRequestQueue.add<AmapGeocodeResponse>(geoUrl);
}

export async function safeFetchAmap<T>(url: string): Promise<T | null> {
  try {
    return await amapRequestQueue.add<T>(url);
  } catch (error) {
    console.error('Amap API request failed:', error);
    return null;
  }
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchPois(lng: string, lat: string, code: string): Promise<AmapPoi[]> {
  const poiUrl = `https://restapi.amap.com/v3/place/around?key=${AMapKey}&location=${lng},${lat}&types=${code}&radius=10000&offset=3&citylimit=true&output=JSON&extensions=all&sortby=distance&children=1`;
  const poiData = await amapRequestQueue.add<AmapPlaceSearchResponse>(poiUrl);
  if (poiData.status === '1' && poiData.pois) {
    return poiData.pois;
  }
  return [];
}

export async function fetchRouteInfo(origin: string, destination: string, city: string) {
  const distPromise = safeFetchAmap<AmapDistanceResponse>(
    `https://restapi.amap.com/v3/distance?key=${AMapKey}&origins=${origin}&destination=${destination}&type=0`,
  );

  const drivePromise = safeFetchAmap<AmapDrivingResponse>(
    `https://restapi.amap.com/v3/direction/driving?key=${AMapKey}&origin=${origin}&destination=${destination}&extensions=base`,
  );

  const transitPromise = safeFetchAmap<AmapTransitResponse>(
    `https://restapi.amap.com/v3/direction/transit/integrated?key=${AMapKey}&origin=${origin}&destination=${destination}&city=${encodeURIComponent(city)}&extensions=base`,
  );

  const bicyclingPromise = safeFetchAmap<AmapBicyclingResponse>(
    `https://restapi.amap.com/v4/direction/bicycling?key=${AMapKey}&origin=${origin}&destination=${destination}`,
  );

  const [distData, driveData, transitData, bicyclingData] = await Promise.all([
    distPromise,
    drivePromise,
    transitPromise,
    bicyclingPromise,
  ]);

  let distance = 'N/A';
  if (distData && distData.status === '1' && distData.results.length > 0) {
    distance = `${distData.results[0].distance}米`;
  }

  let drivingTime = 'N/A';
  if (driveData && driveData.status === '1' && driveData.route.paths.length > 0) {
    drivingTime = `${Math.round(parseInt(driveData.route.paths[0].duration, 10) / 60)}分钟`;
  }

  let transitTime = 'N/A';
  if (transitData && transitData.status === '1' && transitData.route.transits.length > 0) {
    transitTime = `${Math.round(parseInt(transitData.route.transits[0].duration, 10) / 60)}分钟`;
  }

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