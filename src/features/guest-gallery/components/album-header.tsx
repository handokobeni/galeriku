import Image from "next/image";

export function AlbumHeader({ title, photoCount, coverUrl }: {
  title: string;
  photoCount: number;
  coverUrl: string | null;
}) {
  return (
    <header className="relative">
      {coverUrl ? (
        <div className="aspect-[16/9] sm:aspect-[21/9] relative overflow-hidden">
          <Image src={coverUrl} alt={title} fill className="object-cover" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-[#B85738] to-[#1A1A1A]" />
      )}
      <div className="absolute bottom-6 left-6 right-6 text-white">
        <h1 className="text-3xl sm:text-5xl font-semibold">{title}</h1>
        <p className="text-sm opacity-80 mt-2">{photoCount} foto</p>
      </div>
    </header>
  );
}
