import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  Clock, 
  Check, 
  Circle, 
  PieChart, 
  AlertCircle, 
  XCircle, 
  MinusCircle,
  AlertTriangle
} from "lucide-react"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        draft: "bg-slate-100 text-slate-600",
        pending: "bg-warning-100 text-warning-700",
        approved: "bg-brand-50 text-brand-700",
        active: "bg-success-100 text-success-700",
        partially_paid: "bg-info-100 text-info-700",
        paid: "bg-success-100 text-success-700",
        overdue: "bg-danger-100 text-danger-700",
        defaulted: "bg-rose-100 text-rose-800",
        rejected: "bg-slate-100 text-slate-600",
        cancelled: "bg-slate-100 text-slate-500",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
)

const iconMap = {
  draft: Circle,
  pending: Clock,
  approved: Check,
  active: CheckCircle2,
  partially_paid: PieChart,
  paid: Check,
  overdue: AlertCircle,
  defaulted: AlertTriangle,
  rejected: XCircle,
  cancelled: MinusCircle,
}

export interface LoanStatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status: "draft" | "pending" | "approved" | "active" | "partially_paid" | "paid" | "overdue" | "defaulted" | "rejected" | "cancelled"
}

export function LoanStatusBadge({ className, status, ...props }: LoanStatusBadgeProps) {
  const Icon = iconMap[status]
  const formattedText = status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

  return (
    <div className={cn(badgeVariants({ status }), className)} {...props}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {formattedText}
    </div>
  )
}
