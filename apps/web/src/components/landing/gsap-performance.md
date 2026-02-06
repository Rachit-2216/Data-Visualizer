# GSAP ScrollTrigger Performance

## Best Practices

### 1. Use `scrub` Wisely
```javascript
ScrollTrigger.create({
  scrub: 1,
});
```

### 2. Batch Animations
```javascript
gsap.to('.items', {
  scrollTrigger: { trigger: '.container' },
  stagger: 0.1,
  opacity: 1,
});
```

### 3. Optimize Pinning
- Don't pin multiple elements at once
- Use `pinSpacing: false` when appropriate
- Keep pinned sections simple

### 4. Use `will-change` Sparingly
```css
.animated-element { will-change: transform, opacity; }
```

### 5. Refresh on Resize
```javascript
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
});
```

### 6. Kill Triggers on Unmount
```javascript
const trigger = ScrollTrigger.create({ /* ... */ });
return () => trigger.kill();
```
