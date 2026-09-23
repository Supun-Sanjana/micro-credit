export default function Receipt({ params }: { params: { repaymentId: string } }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Receipt</h1>
      <div className="bg-white p-4 rounded shadow">
        Receipt ID: {params.repaymentId}
      </div>
    </div>
  );
}
