export interface AmapPoi {
  id: string;
  name: string;
  location: string;
  address: string;
  distance: string;
}

export interface AmapPlaceSearchResponse {
  status: string;
  info: string;
  pois: AmapPoi[];
}

export interface AmapDistanceResponse {
  status: string;
  info: string;
  results: {
    distance: string;
  }[];
}

export interface AmapDrivingResponse {
  status: string;
  info: string;
  route: {
    paths: {
      duration: string;
    }[];
  };
}

export interface AmapTransitResponse {
  status: string;
  info: string;
  route: {
    transits: {
      duration: string;
    }[];
  };
}

export interface AmapBicyclingResponse {
  errcode: number;
  errmsg: string;
  data: {
    paths: {
      duration: string;
    }[];
  };
}

export interface AmapGeocode {
  location: string;
  city: string | []; // city can be an empty array if not found
}

export interface AmapGeocodeResponse {
  status: string;
  info: string;
  geocodes: AmapGeocode[];
}

export interface PoiResult {
  category: string;
  name: string;
  location: string;
  distance: string;
  drivingTime: string;
  transitTime: string;
  cyclingTime: string;
  longitude?: string;
  latitude?: string;
}

export interface PoiCategory {
  label: string;
  code: string;
} 