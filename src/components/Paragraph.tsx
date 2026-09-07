const Paragraph = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="font-baskervville text-[20px] leading-6">
      {children}
    </p>
  )
}

export default Paragraph