import { getSavingsProducts } from "@/app/actions/savings"
import SavingsProductsClient from "./SavingsProductsClient"

export const metadata = {
  title: "Savings Products | Solida",
}

export default async function SavingsProductsPage() {
  const products = await getSavingsProducts()

  return (
    <div className="h-full">
      <SavingsProductsClient initialProducts={products} />
    </div>
  )
}
