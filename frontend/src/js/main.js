import { 
  THREE,
  OrbitControls, // 显式导入OrbitControls
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  ShaderPass,
  CopyShader
} from './three-modules.js';
import { DataLoader } from './loader.js';
import { PointCloudRenderer } from './renderer.js';
import { ColorMapper } from './colorMapper.js';
import { AnalyticsPanel } from './analytics.js';

class AppState {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = this.initRenderer();
    this.loader = new DataLoader();
    this.pointCloudRenderer = new PointCloudRenderer(this.scene);
    this.analyticsPanel = new AnalyticsPanel();
    this.currentPositions = null;
    this.composer = this.initPostProcessing();
    this.controls = null; // 添加控制器引用
    
    // 初始化场景
    this.initScene().catch(console.error);
  }

  initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    return renderer;
  }

  initPostProcessing() {
    try {
      const renderPass = new RenderPass(this.scene, this.camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, 0.4, 0.85
      );
      
      const composer = new EffectComposer(this.renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      
      // 添加最终的CopyPass
      const copyPass = new ShaderPass(CopyShader);
      composer.addPass(copyPass);
      
      return composer;
    } catch (error) {
      console.error('后期处理初始化失败:', error);
      return null;
    }
  }

  async initScene() {
    // 初始化灯光、控件等
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    
    this.scene.add(
      ambientLight,
      directionalLight,
      new THREE.AxesHelper(10)
    );

    // 加载初始数据
    this.currentPositions = await this.loader.loadAllChunks('mesh');
    const initialColors = new Float32Array(this.currentPositions.length).fill(1);
    this.pointCloudRenderer.updateGeometry(this.currentPositions, initialColors);

    // 初始化相机
    this.camera.position.z = 50;

    // 挂载渲染器
    const vizContainer = document.getElementById('visualization-container');
    vizContainer.appendChild(this.renderer.domElement);

    // 初始化UI
    this.initFieldButtons();
    this.initResizeHandler();
    // 初始化OrbitControls
    this.initControls();
  }

  initControls() {
    // 确保相机和渲染器已初始化
    if (!this.camera || !this.renderer) {
      console.error('Camera or renderer not initialized');
      return;
    }

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // 配置控制器参数
    this.controls.enableDamping = false; // 启用阻尼效果
    this.controls.dampingFactor = 0.05; // 阻尼系数
    this.controls.rotateSpeed = 0.5;    // 旋转速度
    this.controls.zoomSpeed = 1.0;      // 缩放速度
    this.controls.panSpeed = 0.8;       // 平移速度
    this.controls.screenSpacePanning = true; // 启用屏幕空间平移
    this.controls.maxDistance = 200;    // 最大缩放距离
    this.controls.minDistance = 10;     // 最小缩放距离
  }

  initFieldButtons() {
    const fields = [
      { name: 'temperature', displayName: '温度场' },
      { name: 'displacement', displayName: '位移' },
      { name: 'vonmises_stress', displayName: '冯米塞斯应力' },
      { name: 'displace_vector_x', displayName: '位移_x' },
      { name: 'displace_vector_y', displayName: '位移_y' },
      { name: 'displace_vector_z', displayName: '位移_z' }
    ];

    const container = document.getElementById('field-buttons');
    fields.forEach(field => {
      const btn = document.createElement('button');
      btn.textContent = field.displayName;
      btn.onclick = () => this.loadField(field.name);
      container.appendChild(btn);
    });
  }

  initResizeHandler() {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        if (this.composer) {
          this.composer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(document.getElementById('visualization-container'));
  }

  async loadField(fieldName) {
    // 显示加载提示
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
    loadingElement.textContent = `正在加载 ${fieldName}...`;
  
    try {
      // 并行加载元数据和场数据
      const [fieldData, metadata] = await Promise.all([
        this.loader.loadFieldData(fieldName),
        this.loader.loadMetadata('field', fieldName)
      ]);
  
      // 计算颜色映射
      const colors = ColorMapper.mapValues(fieldData, metadata.min, metadata.max);
  
      // 更新点云渲染
      this.pointCloudRenderer.updateGeometry(this.currentPositions, colors);
  
      // 更新分析面板
      this.analyticsPanel.update(fieldData, metadata);
  
      console.log(`成功加载物理场: ${fieldName}`);
    } catch (error) {
      console.error(`加载物理场失败: ${fieldName}`, error);
      
      // 显示错误提示
      loadingElement.textContent = `加载 ${fieldName} 失败，请重试`;
      loadingElement.style.color = '#ff4444';
      
      // 3秒后恢复默认状态
      setTimeout(() => {
        loadingElement.textContent = '加载初始数据...';
        loadingElement.style.color = '';
      }, 3000);
    } finally {
      // 隐藏加载提示
      loadingElement.style.display = 'none';
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // 更新控制器状态
    if (this.controls) {
      this.controls.update();
    }

    // 渲染场景
    this.composer ? this.composer.render() : this.renderer.render(this.scene, this.camera);
  }
}

// 启动应用
new AppState().animate();