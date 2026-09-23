export default function CollectionSheet({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Collection Sheet {params.id}</h1>
      <p className="text-gray-500 text-sm">Members due today...</p>
    </div>
  );
}
