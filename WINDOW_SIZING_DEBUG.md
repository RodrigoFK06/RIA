# 🔍 INVESTIGACIÓN: Problema de Tamaños de Ventanas Flotantes

## 📋 PROBLEMA IDENTIFICADO

**Síntoma**: Las ventanas flotantes aparecen con tamaños grandes (600x500 o similar) en lugar de usar los porcentajes calculados en el store (35-50% del viewport).

## 🔎 ANÁLISIS DEL FLUJO DE DATOS

### **✅ Flujo Correcto Confirmado**

1. **Store (`addWindow`)** ✅ Calcula correctamente:
   ```typescript
   targetSize = {
     width: Math.round(windowSize.width * (config.size.widthPercent / 100)),
     height: Math.round(windowSize.height * (config.size.heightPercent / 100))
   }
   ```

2. **Ventanas individuales** ✅ Pasan props correctamente:
   ```tsx
   <WindowFrame
     initialWidth={windowData.position.width}
     initialHeight={windowData.position.height}
     initialX={windowData.position.x}
     initialY={windowData.position.y}
   />
   ```

3. **WindowFrame** ✅ Recibe y procesa props:
   ```tsx
   const getResponsiveDimensions = () => {
     // Desktop: usar valores calculados del store
     return {
       width: initialWidth,   // Valor del store
       height: initialHeight, // Valor del store
       x: initialX,
       y: initialY,
     }
   }
   ```

4. **Componente Rnd** ✅ Usa dimensiones correctas:
   ```tsx
   <Rnd default={responsiveDimensions} />
   ```

## 🎯 CAUSAS POTENCIALES IDENTIFICADAS

### **1. 🕐 Problema de Hidratación SSR**

**CAUSA**: Durante la hidratación inicial de Next.js, `window.innerWidth/innerHeight` pueden no estar disponibles.

**EVIDENCIA**:
```typescript
const windowSize = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1200, // ← Fallback
  height: typeof window !== 'undefined' ? window.innerHeight : 800  // ← Fallback
}
```

**RESULTADO**: Si `addWindow()` se ejecuta antes de la hidratación completa, usa las dimensiones de fallback (1200x800) en lugar del viewport real.

### **2. 📱 Detección de Breakpoint Incorrecta**

**CAUSA**: El hook `useBreakpoint()` puede tardar en detectar el tamaño real de pantalla.

**EVIDENCIA**: Si `windowSize` en `useBreakpoint()` es `{width: 0, height: 0}` inicialmente, los cálculos son incorrectos.

### **3. 🔄 Race Condition entre Store y Componentes**

**CAUSA**: Los componentes se renderizan antes de que el store tenga acceso al viewport real.

## 🛠️ SOLUCIONES IMPLEMENTADAS

### **Mejora 1: Logs de Debugging**
- ✅ Agregados logs en `store.ts` para verificar cálculos
- ✅ Agregados logs en `WindowFrame` para verificar props recibidos
- ✅ Agregados logs en `StatsWindow` para verificar datos de entrada

### **Mejora 2: Verificación Robusta de Viewport**
```typescript
// Mejorado en store.ts
let windowSize = {
  width: 1200, // fallback
  height: 800  // fallback
}

if (typeof window !== 'undefined') {
  windowSize = {
    width: window.innerWidth || 1200,
    height: window.innerHeight || 800
  }
}
```

## 🔧 SOLUCIONES ADICIONALES PROPUESTAS

### **Solución A: Hook de Viewport Sincronizado**
```typescript
// Crear un hook que garantice dimensiones reales
const useViewportSize = () => {
  const [size, setSize] = useState({ width: 1200, height: 800 })
  
  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    updateSize() // Ejecutar inmediatamente
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  
  return size
}
```

### **Solución B: Recalcular Dimensiones Post-Hidratación**
```typescript
// En WindowFrame, verificar y recalcular si es necesario
useEffect(() => {
  if (typeof window !== 'undefined' && initialWidth > window.innerWidth * 0.8) {
    // Las dimensiones parecen estar basadas en fallback, recalcular
    console.warn('🔄 Recalculando dimensiones post-hidratación')
  }
}, [])
```

### **Solución C: Lazy Loading de Ventanas**
```typescript
// Solo crear ventanas después de confirmar viewport
const [isViewportReady, setIsViewportReady] = useState(false)

useEffect(() => {
  if (typeof window !== 'undefined') {
    setIsViewportReady(true)
  }
}, [])

// Solo permitir addWindow si isViewportReady === true
```

## 📊 TESTING PLAN

Para confirmar qué solución funciona:

1. **Abrir DevTools Console** y buscar logs:
   ```
   🔍 Store addWindow: { type, windowSize, targetSize, finalPosition }
   🔍 WindowFrame props: { initialWidth, initialHeight }
   🔍 WindowFrame responsiveDimensions: { width, height, x, y }
   ```

2. **Verificar valores esperados**:
   - `topic`: ~35% ancho, ~45% alto
   - `reader`: ~40% ancho, ~55% alto
   - `stats`: ~40% ancho, ~50% alto

3. **Identificar discrepancia**:
   - Si `Store addWindow` muestra valores correctos pero `WindowFrame` muestra valores grandes = problema en props
   - Si `Store addWindow` muestra valores grandes = problema de viewport/hidratación

## 🎯 PRÓXIMOS PASOS

1. **Probar la aplicación** y revisar logs en consola
2. **Identificar cuál de las 3 causas** está ocurriendo
3. **Implementar la solución específica** basada en los resultados
4. **Remover logs de debugging** una vez resuelto

---

✅ **ESTADO**: EN INVESTIGACIÓN - Logs agregados para diagnosticar el problema raíz
