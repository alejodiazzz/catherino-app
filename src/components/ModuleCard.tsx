import React from 'react'
import { Link } from 'react-router-dom'

export interface ModuleCardProps {
  title: string
  description: string
  icon: string
  headerColor: string
  link: string
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  headerColor,
  link,
}) => {
  return (
    <Link
      to={link}
      className="bg-white dark:bg-[#2c2c2c] rounded-lg overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)] no-underline"
    >
      <div
        className="h-[120px] flex justify-center items-center text-white"
        style={{ backgroundColor: headerColor }}
      >
        <i className={`${icon} text-5xl`}></i>
      </div>
      <div className="p-5">
        <h3 className="text-lg mb-[10px] text-[#1a1a1a] dark:text-white font-montserrat font-bold">{title}</h3>
        <p className="text-[#95a5a6] dark:text-gray-400 text-sm mb-[15px]">{description}</p>
        <span className="inline-block text-[#1a1a1a] dark:text-white no-underline font-semibold text-sm transition-colors hover:text-[#e74c3c]">
          Acceder al módulo <i className="fas fa-arrow-right"></i>
        </span>
      </div>
    </Link>
  )
}

export default ModuleCard
