import React from 'react'

export interface ActivityItemProps {
  title: string
  time: string
  icon: string
  iconColor: 'gray' | 'red'
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, time, icon, iconColor }) => {
  const getIconColorClass = () => {
    switch (iconColor) {
      case 'gray':
        return 'bg-[#666]'
      case 'red':
        return 'bg-[#e74c3c]'
      default:
        return 'bg-[#95a5a6]'
    }
  }

  return (
    <li className="flex py-[15px] border-b border-[#dcdcdc] last:border-b-0">
      <div
        className={`w-10 h-10 rounded-full flex justify-center items-center mr-[15px] text-white ${getIconColorClass()}`}
      >
        <i className={icon}></i>
      </div>
      <div className="flex-1">
        <div className="font-semibold mb-[5px]">{title}</div>
        <div className="text-xs text-[#95a5a6]">{time}</div>
      </div>
    </li>
  )
}

export default ActivityItem
