export default function NotFound() {
  return (
    <div className="min-h-svh bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold mb-2">Album tidak ditemukan</h1>
      <p className="text-gray-600">Album ini mungkin sudah dihapus atau link salah.</p>
    </div>
  );
}
