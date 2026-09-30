"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "flex w-full",
        orientation === "vertical" ? "flex-row gap-6" : "flex-col gap-4",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "inline-flex h-11 items-center justify-start rounded-xl bg-slate-100 p-1 text-slate-500 border border-slate-200/70 w-fit gap-1",
  {
    variants: {
      variant: {
        default: "bg-slate-100",
        line: "gap-2 bg-transparent border-0 border-b border-border rounded-none p-0 h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-[14px] font-medium transition-all outline-none",
        "text-slate-600 hover:text-navy-950",
        "focus-visible:ring-2 focus-visible:ring-navy-900/20 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-selected:bg-white aria-selected:text-navy-950 aria-selected:shadow-sm aria-selected:font-semibold",
        "data-[selected]:bg-white data-[selected]:text-navy-950 data-[selected]:shadow-sm data-[selected]:font-semibold",
        "data-[active]:bg-white data-[active]:text-navy-950 data-[active]:shadow-sm data-[active]:font-semibold",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("w-full outline-none focus-visible:outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
