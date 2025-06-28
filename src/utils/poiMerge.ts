import type { PoiResult } from '../types/amap';

/**
 * 计算两个地点之间的距离（米）
 * 使用Haversine公式计算球面距离
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 计算两个字符串的相似度（使用编辑距离）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // 删除
        matrix[i][j - 1] + 1,     // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

/**
 * 计算两个中文地名的相似度（优化版本）
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  // 移除常见的地铁线路前缀
  const cleanName1 = name1.replace(/^[^站]*地铁[^站]*线?/, '').replace(/^[^站]*号线?/, '');
  const cleanName2 = name2.replace(/^[^站]*地铁[^站]*线?/, '').replace(/^[^站]*号线?/, '');
  
  // 如果清理后的名称相同，直接返回高相似度
  if (cleanName1 === cleanName2) {
    return 0.9;
  }
  
  // 计算原始相似度
  const originalSimilarity = calculateSimilarity(name1, name2);
  
  // 计算清理后的相似度
  const cleanedSimilarity = calculateSimilarity(cleanName1, cleanName2);
  
  // 返回较高的相似度值
  return Math.max(originalSimilarity, cleanedSimilarity);
}

/**
 * 从距离字符串中提取数值（米）
 */
function extractDistanceInMeters(distanceStr: string): number {
  const match = distanceStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  
  if (distanceStr.includes('公里') || distanceStr.includes('km')) {
    return value * 1000;
  } else if (distanceStr.includes('米') || distanceStr.includes('m')) {
    return value;
  }
  
  return value; // 默认假设为米
}

/**
 * 从位置字符串中提取经纬度
 */
function extractLocation(locationStr: string): { lat: number; lng: number } | null {
  // 尝试匹配 "经度,纬度" 格式
  const coordsMatch = locationStr.match(/(\d+\.\d+),(\d+\.\d+)/);
  if (coordsMatch) {
    return {
      lng: parseFloat(coordsMatch[1]),
      lat: parseFloat(coordsMatch[2])
    };
  }
  
  // 尝试匹配地址中的经纬度信息
  const addressMatch = locationStr.match(/经度[：:]\s*(\d+\.\d+).*纬度[：:]\s*(\d+\.\d+)/);
  if (addressMatch) {
    return {
      lng: parseFloat(addressMatch[1]),
      lat: parseFloat(addressMatch[2])
    };
  }
  
  return null;
}

/**
 * 从PoiResult中提取经纬度
 */
function extractPoiLocation(poi: PoiResult): { lat: number; lng: number } | null {
  // 优先使用PoiResult中的经纬度信息
  if (poi.longitude && poi.latitude) {
    return {
      lng: parseFloat(poi.longitude),
      lat: parseFloat(poi.latitude)
    };
  }
  
  // 回退到从location字符串中提取
  return extractLocation(poi.location);
}

/**
 * 判断两个POI是否为同一地点
 */
function isSameLocation(poi1: PoiResult, poi2: PoiResult): boolean {
  // 1. 检查距离是否小于100米
  const distance1 = extractDistanceInMeters(poi1.distance);
  const distance2 = extractDistanceInMeters(poi2.distance);
  
  // 如果两个POI到起点的距离差异超过100米，则不是同一地点
  if (Math.abs(distance1 - distance2) > 100) {
    return false;
  }
  
  // 2. 检查名称相似度
  const nameSimilarity = calculateNameSimilarity(poi1.name, poi2.name);
  const similarityThreshold = 0.7; // 70%相似度阈值
  
  if (nameSimilarity >= similarityThreshold) {
    return true;
  }
  
  // 3. 如果有位置信息，计算实际地理距离
  const location1 = extractPoiLocation(poi1);
  const location2 = extractPoiLocation(poi2);
  
  if (location1 && location2) {
    const geoDistance = calculateDistance(
      location1.lat, location1.lng,
      location2.lat, location2.lng
    );
    
    // 如果地理距离小于100米且名称有一定相似度，认为是同一地点
    if (geoDistance < 100 && nameSimilarity >= 0.5) {
      return true;
    }
  }
  
  return false;
}

/**
 * 合并相似的POI结果
 */
export function mergeSimilarPois(pois: PoiResult[]): PoiResult[] {
  if (pois.length <= 1) {
    return pois;
  }
  
  const merged: PoiResult[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < pois.length; i++) {
    if (used.has(i)) continue;
    
    const currentPoi = pois[i];
    const similarPois: PoiResult[] = [currentPoi];
    used.add(i);
    
    // 查找与当前POI相似的其他POI
    for (let j = i + 1; j < pois.length; j++) {
      if (used.has(j)) continue;
      
      if (isSameLocation(currentPoi, pois[j])) {
        similarPois.push(pois[j]);
        used.add(j);
      }
    }
    
    // 如果有多个相似POI，选择最优的一个
    if (similarPois.length > 1) {
      // 优先选择距离最近的
      const bestPoi = similarPois.reduce((best, current) => {
        const bestDistance = extractDistanceInMeters(best.distance);
        const currentDistance = extractDistanceInMeters(current.distance);
        return currentDistance < bestDistance ? current : best;
      });
      
      merged.push(bestPoi);
    } else {
      merged.push(currentPoi);
    }
  }
  
  return merged;
}

/**
 * 合并所有分类的POI结果
 */
export function mergeAllPoiResults(results: Record<string, PoiResult[]>): Record<string, PoiResult[]> {
  const mergedResults: Record<string, PoiResult[]> = {};
  
  for (const [category, pois] of Object.entries(results)) {
    mergedResults[category] = mergeSimilarPois(pois);
  }
  
  return mergedResults;
} 