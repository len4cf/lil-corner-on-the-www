import Link from "./Link"

const NavBar = () => {
  return (
    <header className="flex flex-row gap-4">
      <Link href="/notes/teste">blog</Link>
      <Link href="/garden">garden</Link>
      <Link href="/notes/teste">radio</Link>
      <Link href="/notes/teste">sitemap</Link>
    </header>
  )
}

export default NavBar