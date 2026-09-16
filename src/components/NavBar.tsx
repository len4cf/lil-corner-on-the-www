import Link from "./Link"

const NavBar = () => {
  return (
    <header className="flex flex-row gap-4">
      <Link href="/blog">blog</Link>
      <Link href="/garden">garden</Link>
      {/* <Link href="/radio">radio</Link> */}
      {/* <Link href="/notes/teste">sitemap</Link> */}
    </header>
  )
}

export default NavBar