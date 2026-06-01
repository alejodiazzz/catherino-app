# Hooks Personalizados

## useNotifications

Hook personalizado para gestionar el sistema de notificaciones de la aplicación.

### Características

- **Carga automática**: Obtiene productos y genera notificaciones al montar el componente
- **Actualización periódica**: Refresca las notificaciones cada 5 minutos
- **Alertas de inventario**: Genera notificaciones basadas en niveles de stock
- **Gestión de estado**: Maneja el estado de lectura de notificaciones

### Tipos de Notificaciones

1. **Stock Agotado** (Rojo)
   - Productos con 0 unidades
   - Prioridad: Alta

2. **Stock Crítico** (Naranja)
   - Productos con 1-5 unidades
   - Prioridad: Alta

3. **Stock Bajo** (Naranja)
   - Productos con 6-10 unidades
   - Prioridad: Media

4. **Resumen de Inventario** (Azul)
   - Se muestra cuando hay más de 10 alertas
   - Proporciona un resumen general

5. **Estado Normal** (Verde)
   - Se muestra cuando no hay alertas
   - Confirma que todo está en orden

### Uso

```typescript
import { useNotifications } from '../hooks/useNotifications'

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications,
  } = useNotifications()

  return (
    <div>
      <span>Notificaciones sin leer: {unreadCount}</span>
      {/* Renderizar notificaciones */}
    </div>
  )
}
```

### API

#### Valores Retornados

- `notifications`: Array de notificaciones
- `unreadCount`: Número de notificaciones sin leer
- `markAsRead(id)`: Marca una notificación como leída
- `markAllAsRead()`: Marca todas las notificaciones como leídas
- `clearAll()`: Elimina todas las notificaciones
- `refreshNotifications()`: Recarga las notificaciones manualmente

### Configuración

El hook se actualiza automáticamente cada 5 minutos. Para cambiar este intervalo, modifica el valor en el `setInterval`:

```typescript
const interval = setInterval(() => {
  loadProductsAndGenerateNotifications()
}, 5 * 60 * 1000) // 5 minutos en milisegundos
```
