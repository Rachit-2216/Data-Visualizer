# Three.js Performance Optimization

## Critical Performance Rules

### 1. Reduce Draw Calls
- Use `THREE.InstancedMesh` for repeated geometries
- Merge geometries when possible
- Use texture atlases instead of multiple textures

### 2. Optimize Geometry
- Keep vertex count low (< 10k per mesh for real-time)
- Use `BufferGeometry` instead of `Geometry`
- Dispose of geometries when no longer needed

### 3. Shader Optimization
- Keep shader calculations simple
- Move constant calculations to JavaScript
- Use `lowp`/`mediump` precision where possible
- Avoid conditional logic in shaders

### 4. Texture Optimization
- Use power-of-two dimensions (256, 512, 1024, etc.)
- Compress textures (use .basis or .ktx2)
- Set `minFilter` appropriately
- Use `anisotropy` sparingly

### 5. Rendering
- Use `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- Disable features you don't need (shadows, antialiasing on mobile)
- Use `renderer.shadowMap.autoUpdate = false` if shadows don't change
- Consider `renderer.setSize(width, height, false)` to prevent canvas CSS updates

### 6. Animation Loop
- Use `requestAnimationFrame`
- Limit frame rate on mobile (`if (delta > 1/30) return;`)
- Only update uniforms that actually change
- Use `object.matrixAutoUpdate = false` for static objects

### 7. Memory Management
```javascript
geometry.dispose();
material.dispose();
texture.dispose();
renderer.dispose();
```

### 8. Mobile-Specific
- Reduce particle count (5000 max on mobile)
- Disable complex shaders
- Use simpler geometries
- Lower resolution (0.5x to 0.75x pixel ratio)
- Disable post-processing effects
