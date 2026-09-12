import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded border border-slate-800/80 bg-slate-900/60", className)}
      {...props}
    />
  )
}

export { Skeleton }
