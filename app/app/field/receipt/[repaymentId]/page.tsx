export default async function Receipt({ params }: { params: Promise<{ repaymentId: string }> }) {
  const { repaymentId } = await params;
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Receipt</h1>
      <div className="bg-white p-4 rounded shadow">
        Receipt ID: {repaymentId}
      </div>
    </div>
  );
}


