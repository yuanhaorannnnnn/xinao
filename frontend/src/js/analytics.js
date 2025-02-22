// src/js/analytics.js

const echarts = window.echarts;
const Tabulator = window.Tabulator;

// ========================
// 智能数值格式化工具
// ========================
const ValueFormatter = {
  // 动态选择数值表示形式
  format(value, precision = 4) {
    if (value === 0) return '0';
    const absValue = Math.abs(value);
    const log10 = Math.log10(absValue);

    // 自动选择表示法
    if (absValue >= 1e4 || absValue < 1e-3) {
      return value.toExponential(Math.max(1, precision - 1));
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.max(2, Math.ceil(-log10) + 1)
    });
  },

  // 带单位的格式化（自动处理千分位）
  formatWithUnit(value) {
    const units = [
      { threshold: 1e12, unit: 'T' },
      { threshold: 1e9, unit: 'G' },
      { threshold: 1e6, unit: 'M' },
      { threshold: 1e3, unit: 'K' },
      { threshold: 1e-3, unit: 'm' },
      { threshold: 1e-6, unit: 'μ' },
      { threshold: 1e-9, unit: 'n' }
    ];

    let scaledValue = value;
    let selectedUnit = '';

    for (const { threshold, unit } of units) {
      if (Math.abs(value) >= threshold) {
        scaledValue = value / threshold;
        selectedUnit = unit;
        break;
      }
    }

    return `${this.format(scaledValue)} ${selectedUnit}`.trim();
  }
};

// ========================
// 数据分析面板核心类
// ========================
export class AnalyticsPanel {
  constructor() {
    // 表格配置（增强格式化）
    this.statsTable = new Tabulator('#stats-table', {
      layout: 'fitColumns',
      columns: [
        { 
          title: "指标", 
          field: "name",
          width: 120,
          formatter: cell => `<strong>${cell.getValue()}</strong>`
        },
        { 
          title: "数值", 
          field: "value",
          align: "right",
          formatter: cell => {
            const value = cell.getValue();
            return ValueFormatter.format(value);
          }
        }
      ],
      data: []
    });

    // ECharts 实例
    this.histogramChart = echarts.init(document.getElementById('histogram-chart'));
    this.scatterChart = echarts.init(document.getElementById('scatter-plot'));
  }

  // ========================
  // 公开方法
  // ========================
  update(fieldData, metadata) {
    try {
      // 数据预处理
      const processedData = this._preprocessData(fieldData);
      const sampledData = this._sampleData(processedData, 1000);
      
      // 高精度统计计算
      const stats = this._calculateStats(sampledData);
      
      // 更新可视化
      this._updateTable(stats);
      this._updateHistogram(sampledData, stats);
      this._updateScatter(sampledData, stats);
    } catch (error) {
      console.error('数据分析面板更新失败:', error);
      this.clear();
    }
  }

  clear() {
    this.statsTable.clearData();
    this.histogramChart.clear();
    this.scatterChart.clear();
  }

  // ========================
  // 私有方法
  // ========================
  _preprocessData(data) {
    // 处理特殊数值
    return data.map(v => {
      // 处理 NaN 和 Infinity
      if (!Number.isFinite(v)) return 0;
      // 防止极小值下溢
      return Math.abs(v) < Number.EPSILON ? 0 : v;
    });
  }

  _sampleData(data, maxSamples) {
    return data.slice(0, Math.min(maxSamples, data.length));
  }

  _calculateStats(data) {
    if (!data?.length) return { min: 0, max: 0, mean: 0, std: 0 };

    // Kahan 求和算法（提高精度）
    let sum = 0, compensation = 0;
    let min = Infinity, max = -Infinity;
    
    for (const value of data) {
      // 极值追踪
      if (value < min) min = value;
      if (value > max) max = value;

      // 高精度累加
      const y = value - compensation;
      const t = sum + y;
      compensation = (t - sum) - y;
      sum = t;
    }

    const mean = sum / data.length;

    // Welford 算法计算标准差
    let m2 = 0;
    for (const value of data) {
      const delta = value - mean;
      m2 += delta * delta;
    }
    const variance = m2 / data.length;

    return {
      min: min,
      max: max,
      mean: mean,
      std: Math.sqrt(variance)
    };
  }

  _updateTable(stats) {
    this.statsTable.replaceData([
      { name: "最小值", value: stats.min },
      { name: "最大值", value: stats.max },
      { name: "平均值", value: stats.mean },
      { name: "标准差", value: stats.std }
    ]);
  }

  _updateHistogram(data, stats) {
    const range = stats.max - stats.min;
    const isLogScale = range > stats.max / 100; // 超过两个数量级用对数坐标

    const option = {
      title: { text: '数据分布直方图', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: isLogScale ? 'log' : 'value',
        name: '值',
        axisLabel: { formatter: value => ValueFormatter.format(value) },
        min: stats.min,
        max: stats.max
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: value => ValueFormatter.formatWithUnit(value) }
      },
      series: [{
        type: 'histogram',
        data: data,
        barMaxWidth: 40,
        itemStyle: { color: '#5470C6' }
      }]
    };

    // 自动分箱策略
    if (range < 1e-6) {
      option.series[0].barWidth = (range / 10) * 0.9;
    } else {
      option.series[0].barWidth = '80%';
    }

    this.histogramChart.setOption(option);
  }

  _updateScatter(data, stats) {
    const isLogScale = stats.max / stats.min > 1e3;

    this.scatterChart.setOption({
      title: { text: '数据分布散点图', left: 'center' },
      tooltip: { trigger: 'item' },
      xAxis: {
        type: 'value',
        name: '数据点索引',
        axisLabel: { formatter: value => ValueFormatter.format(value) }
      },
      yAxis: {
        type: isLogScale ? 'log' : 'value',
        name: '值',
        axisLabel: { formatter: value => ValueFormatter.format(value) }
      },
      series: [{
        type: 'scatter',
        data: data.map((v, i) => [i, v]),
        symbolSize: 5,
        itemStyle: { color: '#91CC75' }
      }]
    });
  }
}