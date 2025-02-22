import { DataLoader } from './loader.js';
import { PointCloudRenderer } from './renderer.js';
import { ColorMapper } from './colorMapper.js';
import { AnalyticsPanel } from './analytics.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new DataLoader();
const cloudRenderer = new PointCloudRenderer(scene);

const analyticsPanel = new AnalyticsPanel();

async function init() {
  // 加载元数据
  await loader.loadMetadata('mesh');
  await loader.loadMetadata('field', 'temperature');

  // 加载并渲染网格数据
  for await (const coords of loader.loadAllChunks('mesh')) {
    const colors = new Float32Array(coords.length).fill(1); // 白色
    await cloudRenderer.addChunk(coords, colors);
  }

  // 加载并渲染温度场数据
  const tempMetadata = loader.fieldMetadata.get('temperature');
  for await (const values of loader.loadAllChunks('field', 'temperature')) {
    const colors = values.map(v => {
      const t = (v - tempMetadata.min) / (tempMetadata.max - tempMetadata.min);
      return [t, 0, 1 - t]; // 简单颜色映射
    }).flat();
    await cloudRenderer.addChunk(cloudRenderer.positionBuffer, colors);
  }
}

init();

// 在初始化后添加
let currentFieldData = null;

async function updateFieldVisualization(fieldName) {
  try {
    const [fieldData, metadata] = await Promise.all([
      loader.loadFieldData(fieldName),
      loader.loadMetadata('field', fieldName)
    ]);
    
    // 更新可视化
    const colors = ColorMapper.mapValues(fieldData, metadata.min, metadata.max);
    pointCloudRenderer.updateGeometry(currentPositions, colors);
    
    console.log('Field updated:', fieldName);
    // 更新分析面板
    analyticsPanel.update(fieldData, metadata);
    
  } catch (error) {
    console.error('Field update failed:', error);
  }
}

// === 暴露全局函数 ===
window.loadField = async (fieldName) => {
  document.getElementById('loading').textContent = `加载 ${fieldName}...`;
  await updateFieldVisualization(fieldName);
  document.getElementById('loading').textContent = '';
};