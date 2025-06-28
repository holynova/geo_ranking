# POI 合并功能

## 功能说明

POI合并功能用于合并搜索结果中相似的POI（兴趣点），避免显示重复的地点信息。

## 合并规则

### 1. 距离判断
- 如果两个POI到起点的距离差异超过100米，则不会合并
- 距离差异在100米以内是合并的必要条件

### 2. 名称相似度判断
- 使用编辑距离算法计算名称相似度
- 对于中文地名，特别优化了地铁站名称的处理
- 相似度阈值设置为70%（0.7）

### 3. 地理距离判断（可选）
- 如果两个POI都有精确的经纬度信息，会计算实际的地理距离
- 地理距离小于100米且名称相似度≥50%时，也会合并

## 算法特点

### 名称相似度优化
- 自动移除地铁线路前缀（如"北京地铁1号线"、"1号线"等）
- 保留核心地名部分进行相似度计算
- 例如："北京地铁1号线天安门东站" 和 "天安门东地铁站" 会被识别为同一地点

### 合并策略
- 当发现多个相似POI时，优先选择距离起点最近的
- 保留最优的交通信息（驾车、公交、骑行时间）

## 使用方法

```typescript
import { mergeSimilarPois, mergeAllPoiResults } from './poiMerge';
import type { PoiResult } from '../types/amap';

// 合并单个分类的POI
const mergedPois = mergeSimilarPois(poiArray);

// 合并所有分类的POI
const mergedResults = mergeAllPoiResults(resultsObject);
```

## 示例

### 输入数据
```typescript
const pois = [
  {
    name: '北京地铁1号线天安门东站',
    distance: '500米',
    longitude: '116.397428',
    latitude: '39.909187'
  },
  {
    name: '天安门东地铁站',
    distance: '520米',
    longitude: '116.397428',
    latitude: '39.909187'
  }
];
```

### 输出结果
```typescript
// 合并后只保留一个POI（距离最近的）
const merged = [
  {
    name: '北京地铁1号线天安门东站',
    distance: '500米',
    longitude: '116.397428',
    latitude: '39.909187'
  }
];
```

## 配置参数

可以通过修改以下参数来调整合并行为：

- `similarityThreshold`: 名称相似度阈值（默认0.7）
- `distanceThreshold`: 距离差异阈值（默认100米）
- `geoDistanceThreshold`: 地理距离阈值（默认100米）

## 注意事项

1. 合并功能会改变原始数据的顺序
2. 建议在显示结果前进行合并处理
3. 合并后的结果会保留距离最近的POI信息
4. 该功能主要针对中文地名优化，特别是地铁站名称 