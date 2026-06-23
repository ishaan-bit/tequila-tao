# Tequila Tao — Developer Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📱 Mobile Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Click device icon (Ctrl+Shift+M)
3. Select "iPhone SE" or "Galaxy S20"
4. Throttle to "Slow 3G" in Network tab
5. Check FPS in Rendering tab

### Test URLs
- Local: `http://localhost:5173`
- Production: [Your Firebase URL]

## 🎨 Design System

### Colors
```js
'tao-wine': '#800020',    // Yang (burgundy)
'tao-pearl': '#F8F8FF',   // Yin (white)
'tao-emerald': '#10B981', // Success/health
'tao-noir': '#0A0A0A',    // Deep black
```

### Breakpoints
```js
xs: '360px',   // Small phones
sm: '640px',   // Default phones
md: '768px',   // Large phones/tablets
lg: '1024px',  // Desktop
```

### Touch Targets
- Minimum: `44px` (iOS standard)
- Recommended: `min-h-touch` utility class
- Large: `56px` (`min-h-touch-lg`)

## 🎭 Animation System

### Using Presets
```jsx
import { TRANSITIONS, VARIANTS, GESTURES } from './utils/animations';

<motion.div
  variants={VARIANTS.fade}
  transition={TRANSITIONS.standard}
  {...GESTURES.tap}
>
  Content
</motion.div>
```

### Custom Easings
```js
EASINGS.tao        // [0.65, 0, 0.35, 1] - Brand signature
EASINGS.smooth     // [0.25, 0.1, 0.25, 1] - Organic
EASINGS.sharp      // [0.4, 0, 0.6, 1] - Fast entrance
```

## 🔊 Haptic Feedback

```jsx
import { hapticButton, hapticSuccess } from './utils/haptics';

// Button press
onClick={() => {
  hapticButton();
  // your action
}}

// Success action
onSuccess={() => {
  hapticSuccess();
  // your action
}}
```

## 📊 Performance Monitoring

### In Development
```jsx
// FPS Monitor (auto-shows in dev)
import { FPSMonitor } from './utils/performance';
const monitor = new FPSMonitor();
monitor.create(); // Shows FPS counter
```

### In Production
```jsx
// Web Vitals (auto-tracked)
import { initWebVitals } from './utils/performance';
initWebVitals(); // Logs CLS, FID, LCP, etc.
```

## 🔥 Firebase Integration

### Auth
```jsx
import { onAuth, signInWithGoogle, signOut } from './firebase';

// Listen to auth state
useEffect(() => {
  const unsub = onAuth((user) => {
    setUser(user);
  });
  return () => unsub();
}, []);
```

### Firestore
```jsx
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Update session
const sessionRef = doc(db, `users/${uid}/sessions/${sessionId}`);
await updateDoc(sessionRef, { yin1: 150000 });
```

## 🎬 Route Transitions

### Swirl Effect (Signature)
```jsx
// Capture frame
const captureFrame = () => {
  // Canvas snapshot logic
};

// Trigger swirl
setSnapshotUrl(captureFrame());
setIsSwirling(true);

setTimeout(() => {
  navigate('/next-route');
}, 900); // Match animation duration
```

## 🛠 Common Patterns

### Loading State
```jsx
<div className="fixed inset-0 bg-black grid place-items-center">
  <div className="inline-block h-8 w-8 animate-spin rounded-full 
    border-2 border-white border-t-transparent"></div>
</div>
```

### Glassmorphism Button
```jsx
<button className="rounded-full bg-white/15 backdrop-blur 
  px-6 py-3 hover:bg-white/25 active:scale-[0.98] 
  transition-all duration-150">
  Button Text
</button>
```

### Safe Area Padding
```jsx
// Automatic via index.css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

// Manual
<div className="pt-safe-top pb-safe-bottom">
  Content
</div>
```

## 🐛 Debugging

### Performance Issues
1. Check FPS monitor (should be 58-60fps)
2. Run Lighthouse audit in DevTools
3. Check bundle size: `ANALYZE=true npm run build`
4. Profile with React DevTools Profiler

### Animation Jank
1. Add `will-change: transform` to animated elements
2. Use `transform` instead of `left/top`
3. Reduce number of simultaneous animations
4. Check `prefers-reduced-motion` compliance

### Layout Shift
1. Set explicit width/height on images
2. Use `aspect-ratio` CSS property
3. Reserve space for dynamic content
4. Test on actual devices (not just emulator)

## 📦 Bundle Optimization

### Current Chunks
```
react-vendor.js      ~43KB (gzipped)
firebase-vendor.js   ~85KB (gzipped)
motion-vendor.js     ~35KB (gzipped)
main.js              ~62KB (gzipped)
```

### Adding New Dependencies
1. Check bundle impact: `npm run build`
2. Consider tree-shaking support
3. Use dynamic imports for heavy libs
4. Update Vite config chunk strategy if needed

## 🎯 Lighthouse Targets

### Passing Scores
- Performance: **≥ 90**
- Accessibility: **≥ 95**
- Best Practices: **≥ 90**
- SEO: **≥ 90**

### Common Issues
- Large images → use WebP/AVIF
- Render-blocking CSS → inline critical CSS
- Third-party scripts → defer/async
- Missing alt text → add to all images

## 📝 Git Commit Convention

```bash
# Format
type(scope): message

# Examples
feat(dashboard): add haptic feedback to mode buttons
perf(bundle): reduce main chunk size by 30%
fix(mobile): correct safe-area padding on iPhone 14
style(ui): update button hover states
docs(readme): add performance metrics
```

## 🔐 Environment Variables

Create `.env` file:
```bash
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚨 Common Gotchas

1. **iOS Autoplay**: Videos need `muted` + `playsInline`
2. **Input Zoom**: Font-size must be ≥16px on iOS
3. **Tap Delay**: Use `-webkit-tap-highlight-color: transparent`
4. **Pull-to-Refresh**: Disable with `overscroll-behavior-y: none`
5. **Notch Devices**: Use `viewport-fit=cover` + safe-area-inset

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Web Vitals](https://web.dev/vitals/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Last Updated:** October 23, 2025  
**Maintained by:** Development Team
