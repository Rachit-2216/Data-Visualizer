export const advancedVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uMouseRadius;
  uniform float uMouseStrength;
  uniform float uNoiseScale;
  uniform float uNoiseSpeed;

  attribute float aScale;
  attribute float aRandomness;
  attribute vec3 aOriginalPosition;

  varying float vAlpha;
  varying float vDistance;
  varying vec3 vColor;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;

    float noise1 = snoise(pos * uNoiseScale + vec3(uTime * uNoiseSpeed));
    float noise2 = snoise(pos * uNoiseScale * 1.5 + vec3(uTime * uNoiseSpeed * 0.7 + 100.0));
    float noise3 = snoise(pos * uNoiseScale * 0.5 + vec3(uTime * uNoiseSpeed * 0.3 + 200.0));

    pos.x += noise1 * 2.0;
    pos.y += noise2 * 2.0;
    pos.z += noise3 * 1.5;

    float breathe = sin(uTime * 0.3 + aRandomness * 6.28) * 0.5 + 0.5;
    pos *= 1.0 + (breathe * 0.1);

    float angle = uTime * 0.05 + aRandomness * 6.28;
    float cosA = cos(angle);
    float sinA = sin(angle);
    mat2 rotationMatrix = mat2(cosA, -sinA, sinA, cosA);
    pos.xz = rotationMatrix * pos.xz;

    vec3 mousePos3D = vec3(uMouse.x * 50.0, uMouse.y * 30.0, 0.0);
    float distToMouse = distance(pos.xy, mousePos3D.xy);
    float repelZone = uMouseRadius * 0.5;
    float attractZone = uMouseRadius;

    if (distToMouse < repelZone) {
      vec2 pushDir = normalize(pos.xy - mousePos3D.xy);
      float strength = smoothstep(repelZone, 0.0, distToMouse) * uMouseStrength;
      pos.xy += pushDir * strength * 2.0;
      pos.z += strength;
    } else if (distToMouse < attractZone) {
      vec2 pullDir = normalize(mousePos3D.xy - pos.xy);
      float strength = smoothstep(attractZone, repelZone, distToMouse) * uMouseStrength * 0.3;
      pos.xy += pullDir * strength;
    }

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    float size = 2.0 * aScale * uPixelRatio;
    size *= (1.0 + breathe * 0.3);

    if (distToMouse < attractZone) {
      float proximity = smoothstep(attractZone, 0.0, distToMouse);
      size *= (1.0 + proximity * 0.5);
    }

    gl_PointSize = size * (300.0 / -viewPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);

    vDistance = length(position) / 50.0;
    vAlpha = (1.0 - vDistance * 0.5) * (0.6 + breathe * 0.4);

    if (distToMouse < attractZone) {
      float proximity = smoothstep(attractZone, 0.0, distToMouse);
      vAlpha += proximity * 0.4;
    }

    vColor = vec3(
      0.5 + noise1 * 0.2,
      0.5 + noise2 * 0.2,
      0.5 + noise3 * 0.2
    );
  }
`;

export const advancedFragmentShader = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uTime;

  varying float vAlpha;
  varying float vDistance;
  varying vec3 vColor;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) {
      discard;
    }

    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    float glow = 1.0 - smoothstep(0.2, 0.5, dist);

    alpha = core + glow * 0.5;
    alpha *= vAlpha;

    vec3 color = mix(uColorA, uColorB, vDistance);
    color = mix(color, uColorC, vColor.r * 0.3);
    color += vColor * 0.15;

    vec3 colorShift = vec3(
      sin(uTime * 0.5) * 0.05,
      cos(uTime * 0.3) * 0.05,
      sin(uTime * 0.7) * 0.05
    );
    color += colorShift;

    color += core * 0.4;

    gl_FragColor = vec4(color, alpha);
  }
`;
