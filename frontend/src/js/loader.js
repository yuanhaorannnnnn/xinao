export class DataLoader {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.meshMetadata = null;
  }

  async loadMetadata(dataType, fieldName = '') {
    const endpoint = dataType === 'mesh' 
      ? `${this.baseURL}/mesh/metadata`
      : `${this.baseURL}/field/${fieldName}/metadata`;
    
    try {
      console.log(`Fetching metadata from: ${endpoint}`);  // 调试请求URL
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();  // 捕获错误响应内容
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Metadata load failed:', error);
      throw error;
    }
  }

  // 新增物理场加载方法
  async loadFieldData(fieldName) {
    const metadata = await this.loadMetadata('field', fieldName);
    const totalChunks = Math.ceil(metadata.total_points / metadata.chunk_size);
    
    const combined = new Float32Array(metadata.total_points);
    let offset = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = await this.loadChunk('field', fieldName, i);
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    return combined;
  }

  async loadChunk(dataType, fieldName = '', chunkId) {
    const endpoint = dataType === 'mesh'
      ? `${this.baseURL}/mesh/chunk/${chunkId}`
      : `${this.baseURL}/field/${fieldName}/chunk/${chunkId}`;

    try {
      // console.log('loading chunk URL:', this.baseURL)
      // console.log('loading chunk Id:', chunkId)
      console.log('loading chunk data type:', dataType)
      const response = await fetch(endpoint);
      // console.log('response status:', response.status, response.ok)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const buffer = await response.arrayBuffer();
      return new Float32Array(buffer);
    } catch (error) {
      console.error('Chunk load failed:', error);
      throw error;
    }
  }

  async loadAllChunks(dataType, fieldName = '') {
    const metadata = await this.loadMetadata(dataType);
    
    // 初始化定型数组提升性能
    const combined = new Float32Array(metadata.total_points * 3);
    let offset = 0;
    
    for (let i = 0; i < metadata.total_chunks; i++) {
      const chunk = await this.loadChunk(dataType, fieldName, i);
      
      // 数据校验
      if (chunk.length % 3 !== 0) {
        console.error(`Invalid chunk ${i} length: ${chunk.length}`);
        continue;
      }
      
      // 计算实际点数
      const actualPoints = Math.min(
        metadata.chunk_size,
        metadata.total_points - i * metadata.chunk_size
      );
      
      // 校验数据长度
      if (chunk.length !== actualPoints * 3) {
        console.warn(`Chunk ${i} size mismatch: expected ${actualPoints*3}, got ${chunk.length}`);
      }
      
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // 裁剪多余空间（最后一个块可能不满）
    const finalData = combined.slice(0, metadata.total_points * 3);
    console.log("Valid points loaded:", finalData.length / 3);
    return finalData;
  }
}