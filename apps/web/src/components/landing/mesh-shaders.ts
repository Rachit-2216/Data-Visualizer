export const meshVertexShader = `
  uniform float uTime;
  uniform float uPointSize;
  varying float vHeight;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uPointSize * (300.0 / -mv.z);
    size *= (1.0 + position.y * 0.06);
    gl_PointSize = clamp(size, 1.0, 7.0);
    vHeight = position.y;
  }
`;

export const meshFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vHeight;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.0, dist);
    float glow = smoothstep(-2.0, 2.0, vHeight);
    vec3 color = mix(uColor * 0.6, uColor, glow);

    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;
