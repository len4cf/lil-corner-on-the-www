const Paragraph = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <p className={`font-baskervville text-[20px] leading-6 ${className || ''}`}>
      {children}
    </p>
  )
}

export default Paragraph