const Link = ({ children, href }: { children: React.ReactNode; href: string }) => {
  return (
    <a className="font-baskervville lg:text-[20px] text-[16px] underline underline-offset-4 hover:text-[#73976A] transition-colors" href={href}>
      {children}
    </a>
  )
}

export default Link