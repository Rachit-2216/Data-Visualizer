export const meshVertexShader = `
  uniform float uTime;
  varying float vElevation;

  void main() {
    vec3 pos = position;
    float wave = sin(pos.x * 0.08 + uTime) * 0.25 + cos(pos.y * 0.08 + uTime * 0.7) * 0.2;
    pos.z += wave;
    vElevation = pos.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const meshFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vElevation;

  void main() {
    float glow = smoothstep(-2.0, 2.0, vElevation);
    vec3 color = mix(uColor * 0.6, uColor, glow);
    gl_FragColor = vec4(color, uOpacity);
  }
`;
