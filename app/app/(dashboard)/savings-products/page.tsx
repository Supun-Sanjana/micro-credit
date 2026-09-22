import { getSavingsProducts } from "@/app/actions/savings"
import SavingsProductsClient from "./SavingsProductsClient"

export const metadata = {
  title: "Savings Products | Solida",
}

export default async function SavingsProductsPage() {
  const products = await getSavingsProducts()

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Savings Products
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Configure savings products and their parameters.
        </p>
      </div>

      <SavingsProductsClient initialProducts={products} />
    </div>
  )
}
