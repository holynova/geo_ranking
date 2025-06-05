# 地理位置便利性分析移动端网站 / Geo Location Convenience Analysis Mobile Web App

## 简介 / Introduction

本项目是一个基于 React + Vite + Tailwind CSS 的移动端友好型网站，用户可输入任意中文地址，系统将分析其周边生活便利设施（如地铁站、三甲医院、图书馆等）并提供详细的交通信息，帮助用户评估地址的便利性。

This project is a mobile-friendly web app built with React, Vite, and Tailwind CSS. Users can input any Chinese address, and the system will analyze nearby amenities (such as subway stations, top hospitals, libraries, etc.) and provide detailed transportation information to help users evaluate the convenience of a location.

---

## 主要功能 / Features

- 地址输入与高德地图API地理编码
- 查询10公里内6类关键POI（地铁站、三甲医院、图书馆、博物馆、公园、美术馆）
- 每类展示最近3个结果，含名称、直线距离、驾车/公交/骑行时间
- 全部交通数据实时调用高德API获取
- 移动端优先设计，界面美观，交互友好
- 错误与加载状态友好提示

- Address input and geocoding via AMap (Gaode) API
- Search for 6 types of key POIs within 10km (subway, top hospitals, libraries, museums, parks, art galleries)
- Show up to 3 nearest results per category, including name, straight-line distance, driving/transit/cycling time
- All transportation data fetched in real-time from AMap API
- Mobile-first, beautiful UI, user-friendly interaction
- Friendly error and loading state handling

---

## 技术栈 / Tech Stack

- React 19
- Vite 6
- Tailwind CSS 4
- TypeScript
- 高德地图开放平台 API (AMap Open Platform API)

---

## 快速开始 / Getting Started

1. **安装依赖 / Install dependencies**
   ```bash
   pnpm install
   ```
2. **配置环境变量 / Configure environment variables**
   在项目根目录下新建 `.env` 文件，内容如下：
   ```env
   VITE_AMAP_KEY=你的高德API密钥
   ```
   > 请在[高德开放平台](https://console.amap.com/dev/key/app)申请Web服务类型的Key。

   Create a `.env` file in the project root:
   ```env
   VITE_AMAP_KEY=your_amap_api_key
   ```
   > Please apply for a Web Service type key at [AMap Open Platform](https://console.amap.com/dev/key/app).

3. **启动开发服务器 / Start dev server**
   ```bash
   pnpm dev
   ```
   访问 http://localhost:5173 （或终端提示端口）

   Visit http://localhost:5173 (or the port shown in terminal)

---

## 主要界面说明 / Main UI Overview

- 顶部为项目标题和简要说明卡片
- 中部为地址输入与分析按钮，绿色渐变风格
- 下方为分组卡片，展示各类POI及交通信息，带图标和主色
- 移动端自适应，圆角、阴影、渐变背景

- Top: Project title and brief description card
- Middle: Address input and analysis button (green gradient)
- Below: Grouped cards showing POIs and transportation info, with icons and main color
- Mobile responsive, rounded corners, shadow, gradient background

---

## 其他 / Others

- 本项目仅用于学习与演示，API Key 请妥善保管，避免泄露。
- This project is for learning/demo purposes only. Please keep your API Key safe.
