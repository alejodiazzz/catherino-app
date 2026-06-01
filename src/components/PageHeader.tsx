import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <section className="mb-[30px]">
      <h1 className="text-[32px] text-[#1a1a1a] dark:text-white mb-[10px] font-montserrat font-bold transition-colors">{title}</h1>
      {description && <p className="text-[#95a5a6] dark:text-gray-400 text-base max-w-[800px] transition-colors">{description}</p>}
    </section>
  )
}

export default PageHeader
