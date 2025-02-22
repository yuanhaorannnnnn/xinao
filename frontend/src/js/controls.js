export function initScene() {
    // 场景初始化
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 基础光照
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 坐标系辅助
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 相机位置
    camera.position.z = 10;

    // 添加轨道控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    return { scene, camera, renderer };
}

export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}