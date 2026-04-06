export default function AlbumsPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Galeriku</h1>
          <p className="text-sm text-muted-foreground">Your albums will appear here</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-1">+</div>
            <div className="text-xs">New Album</div>
          </div>
        </div>
      </div>
    </div>
  );
}
