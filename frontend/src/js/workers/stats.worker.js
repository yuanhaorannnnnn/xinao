// src/js/workers/stats.worker.js
self.addEventListener('message', (e) => {
    const data = e.data;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const mean = data.reduce((a,b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a,b) => a + Math.pow(b-mean,2), 0) / data.length);
    
    self.postMessage({ min, max, mean, std });
  });
  
// 在AnalyticsPanel中使用
calculateStats(data) {
return new Promise((resolve) => {
    const worker = new Worker('./workers/stats.worker.js');
    worker.postMessage(data);
    worker.onmessage = (e) => resolve(e.data);
});
}