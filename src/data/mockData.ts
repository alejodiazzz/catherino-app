import { InventoryAlertProps } from '../components/InventoryAlert'

export const inventoryAlerts: InventoryAlertProps[] = [
  {
    title: 'Stock Crítico',
    time: 'Hace 2 horas',
    message: 'Camiseta Deportiva Elite (Talla L) tiene solo 3 unidades en stock',
    actionText: 'Reabastecer ahora',
    onAction: () => console.log('Reabastecer'),
  },
  {
    title: 'Stock Bajo',
    time: 'Hace 5 horas',
    message: 'Zapatillas Runner Pro (Talla 42) ha alcanzado el nivel mínimo de stock',
    actionText: 'Ver detalles',
    onAction: () => console.log('Ver detalles'),
  },
  {
    title: 'Stock Agotado',
    time: 'Ayer',
    message: 'Chaqueta Impermeable (Color Negro) no tiene unidades disponibles',
    actionText: 'Generar orden',
    onAction: () => console.log('Generar orden'),
  },
]
