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

export async function fetchGeocode(address: string): Promise<AmapGeocodeResponse> {
  const geoUrl = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&output=JSON&key=${AMapKey}`;
  const geoResp = await fetch(geoUrl);
  return (await geoResp.json()) as AmapGeocodeResponse;
}

export async function safeFetchAmap(url: string): Promise<unknown> {
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

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchPois(lng: string, lat: string, code: string): Promise<AmapPoi[]> {
  const poiUrl = `https://restapi.amap.com/v3/place/around?key=${AMapKey}&location=${lng},${lat}&types=${code}&radius=10000&offset=3&citylimit=true&output=JSON&extensions=all&sortby=distance&children=1`;
  const poiResp = await fetch(poiUrl);
  const poiData = (await poiResp.json()) as AmapPlaceSearchResponse;
  if (poiData.status === '1' && poiData.pois) {
    return poiData.pois;
  }
  return [];
}

export async function fetchRouteInfo(origin: string, destination: string, city: string) {
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