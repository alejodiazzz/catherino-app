import React from 'react'

export interface KPICardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeType = 'neutral' }) => {
  const getChangeColorClass = () => {
    switch (changeType) {
      case 'positive':
        return 'text-[#3d9970]'
      case 'negative':
        return 'text-[#e74c3c]'
      default:
        return 'text-[#333] dark:text-gray-300'
    }
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return 'fa-arrow-up'
      case 'negative':
        return 'fa-arrow-down'
      default:
        return ''
    }
  }

  return (
    <div className="bg-white dark:bg-[#2c2c2c] rounded-lg p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
      <div className="text-base text-[#95a5a6] dark:text-gray-400 mb-[10px]">{title}</div>
      <div className="font-mono text-[28px] font-semibold mb-[5px] text-[#1a1a1a] dark:text-white">{value}</div>
      {change && (
        <div className={`text-sm flex items-center ${getChangeColorClass()}`}>
          {getChangeIcon() && <i className={`fas ${getChangeIcon()} mr-1`}></i>}
          {change}
        </div>
      )}
    </div>
  )
}

export default KPICard
