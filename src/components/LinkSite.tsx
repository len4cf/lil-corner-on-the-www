const LinkSite = ({ name, description, href }: { name?: string; description?: string; href: string }) => {
  return (
    <a
      className="flex flex-col gap-2 p-4 w-auto lg:w-175 border border-[#73976A] rounded-lg hover:bg-[#73976A] hover:text-white transition-colors"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <h2 className="font-velve text-[24px]">{href}</h2>
      <p className="font-baskervville text-[16px]">{description}</p>
    </a>
  )
}

export default LinkSite