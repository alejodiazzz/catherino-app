import React from 'react'

export interface SummaryCardProps {
  title: string
  value: string | number
  description: string
  icon: string
  iconColor: 'red' | 'gray'
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  description,
  icon,
  iconColor,
}) => {
  const getIconColorClass = () => {
    switch (iconColor) {
      case 'red':
        return 'bg-[#e74c3c]'
      case 'gray':
        return 'bg-[#666]'
      default:
        return 'bg-[#95a5a6]'
    }
  }

  return (
    <div className="bg-white dark:bg-[#2c2c2c] rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-[5px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center mb-[15px]">
        <h3 className="text-lg text-[#333] dark:text-white">{title}</h3>
        <div
          className={`w-10 h-10 rounded-full flex justify-center items-center text-white ${getIconColorClass()}`}
        >
          <i className={icon}></i>
        </div>
      </div>
      <div className="font-mono text-[32px] font-semibold my-[10px] text-[#1a1a1a] dark:text-white">{value}</div>
      <div className="text-[#95a5a6] dark:text-gray-400 text-sm">{description}</div>
    </div>
  )
}

export default SummaryCard
