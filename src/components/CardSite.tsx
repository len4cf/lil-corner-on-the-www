import { cn } from "@sglara/cn";

const CardSite = ({ name, description, href }: { name: string; description: string; href: string }) => {
  return (
    <div className={cn(
      "border border-dashed  p-4"
    )}>
      <p className="text-center">{description}</p>
      <iframe width="700" height="300" src={href} title={name}>
      </iframe>
    </div>
  )
}

export default CardSite