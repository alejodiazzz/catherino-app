import React from 'react'
import InventoryAlert, { InventoryAlertProps } from './InventoryAlert'

interface InventoryAlertsProps {
  alerts: InventoryAlertProps[]
  title?: string
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
  alerts,
  title = 'Alertas de Inventario',
}) => {
  return (
    <section className="mb-[30px]">
      <h2 className="text-[22px] mb-5 text-[#1a1a1a] dark:text-white font-montserrat font-bold">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {alerts.map((alert, index) => (
          <InventoryAlert key={index} {...alert} />
        ))}
      </div>
    </section>
  )
}

export default InventoryAlerts
