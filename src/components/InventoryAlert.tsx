import React from 'react'

export interface InventoryAlertProps {
  title: string
  time: string
  message: string
  actionText: string
  onAction?: () => void
}

const InventoryAlert: React.FC<InventoryAlertProps> = ({
  title,
  time,
  message,
  actionText,
  onAction,
}) => {
  return (
    <div className="bg-white dark:bg-[#2c2c2c] border-l-4 border-[#e74c3c] rounded p-[15px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      <div className="flex justify-between items-center mb-[10px]">
        <div className="font-semibold text-[#e74c3c]">{title}</div>
        <div className="text-xs text-[#95a5a6] dark:text-gray-400">{time}</div>
      </div>
      <div className="text-sm mb-[10px] text-[#333] dark:text-gray-300">{message}</div>
      <button
        onClick={onAction}
        className="inline-block bg-[#e74c3c] text-white py-[5px] px-3 rounded text-xs font-semibold no-underline transition-colors hover:bg-[#c0392b] border-none cursor-pointer"
      >
        {actionText}
      </button>
    </div>
  )
}

export default InventoryAlert
