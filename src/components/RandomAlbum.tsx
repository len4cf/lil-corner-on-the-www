import { useEffect, useState } from 'react'

type Album = {
  id: number
  title: string
  artist: string
  link: string
  cover: string
}

const RandomAlbum = ({ albums }: { albums: Album[] }) => {
  const [album, setAlbum] = useState<Album | null>(null)

  useEffect(() => {
    const now = new Date()
    const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
    setAlbum(albums[day % albums.length])

    setAlbum(albums[Math.floor(Math.random() * albums.length)])
  }, [albums])

  if (!album) return <div className="mt-6 w-60 h-60" />

  return (
    <div
      className="mt-6 flex flex-col gap-2 w-100 items-center"
    >
      <img
        className="w-60 h-60 object-cover rounded-sm"
        src={album.cover}
        alt={`Capa de ${album.title}, de ${album.artist}`}
      />
      <p className="font-jubilat text-2xl tracking-widest mt-10 uppercase text-center">{album.title}</p>
      <p className="font-baskervville text-xl">{album.artist}</p>
      <a href={album.link} target="_blank" rel="noopener noreferrer" className="underline font-baskervville mt-10">ouça aqui</a>
    </div>
  )
}

export default RandomAlbum
