export const particleVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uMouseRadius;
  uniform float uMouseStrength;

  attribute float aScale;
  attribute float aRandomness;
  attribute vec3 aOriginalPosition;

  varying float vAlpha;
  varying float vDistance;

  void main() {
    vec3 pos = position;

    float breathe = sin(uTime * 0.5 + aRandomness * 6.28) * 0.5 + 0.5;
    pos *= 0.95 + breathe * 0.1;

    pos.x += sin(uTime * 0.3 + pos.y * 0.5 + aRandomness) * 0.3;
    pos.y += cos(uTime * 0.2 + pos.x * 0.5 + aRandomness) * 0.3;
    pos.z += sin(uTime * 0.4 + aRandomness * 2.0) * 0.2;

    vec3 mousePos3D = vec3(uMouse.x * 50.0, uMouse.y * 30.0, 0.0);
    float distToMouse = distance(pos.xy, mousePos3D.xy);

    if (distToMouse < uMouseRadius) {
      vec2 pushDir = normalize(pos.xy - mousePos3D.xy);
      float pushStrength = smoothstep(uMouseRadius, 0.0, distToMouse) * uMouseStrength;
      pos.xy += pushDir * pushStrength;
      pos.z += pushStrength * 0.5;
    }

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    float size = 2.0 * aScale * uPixelRatio;
    size *= (1.0 + breathe * 0.3);
    gl_PointSize = size * (300.0 / -viewPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);

    vDistance = length(position) / 50.0;
    vAlpha = (1.0 - vDistance * 0.5) * (0.6 + breathe * 0.4);

    if (distToMouse < uMouseRadius) {
      vAlpha += smoothstep(uMouseRadius, 0.0, distToMouse) * 0.3;
    }
  }
`;

export const particleFragmentShader = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;

  varying float vAlpha;
  varying float vDistance;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) {
      discard;
    }

    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;

    vec3 color = mix(uColorA, uColorB, vDistance);

    color += vec3(
      sin(uTime * 0.5) * 0.05,
      cos(uTime * 0.3) * 0.05,
      sin(uTime * 0.7) * 0.05
    );

    float glow = 1.0 - dist * 2.0;
    glow = max(0.0, glow);
    color += glow * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;
