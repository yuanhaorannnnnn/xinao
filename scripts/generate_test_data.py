import numpy as np

# 生成测试网格数据 (100个点)
mesh_data = {
    'node_ids': np.arange(100),
    'node_coords': np.random.rand(100, 3).astype(np.float32),
    'elements': np.zeros((0, 10))  # 空数组
}
np.savez('test_mesh.npz', **mesh_data)

# 生成测试物理场数据
field_data = {
    'temperature': np.random.rand(100).astype(np.float32) * 100 + 273,
    'displacement': np.random.rand(100).astype(np.float32) * 0.1
}
np.savez('test_temperature_250.0_result.npz', **field_data)