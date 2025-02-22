export class ColorMapper {
    static thermalGradient(t) {
      return {
        r: Math.min(1, t * 2),
        g: Math.min(1, t * 1.5 - 0.2),
        b: Math.max(0, 1 - t * 1.5)
      };
    }
  
    static mapValues(values, min, max) {
      const colors = new Float32Array(values.length * 3);
      
      values.forEach((v, i) => {
        const t = (v - min) / (max - min);
        const color = this.thermalGradient(t);
        colors[i*3] = color.r;
        colors[i*3+1] = color.g;
        colors[i*3+2] = color.b;
      });
      
      return colors;
    }
  }