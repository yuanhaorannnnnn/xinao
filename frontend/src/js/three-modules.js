// frontend/src/js/three-modules.js
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/shaders/CopyShader.js';

// 确保全局可用
// window.THREE = THREE;
// window.OrbitControls = OrbitControls;

export {
  THREE,
  EffectComposer,
  OrbitControls,
  RenderPass,
  UnrealBloomPass,
  ShaderPass,
  CopyShader
};