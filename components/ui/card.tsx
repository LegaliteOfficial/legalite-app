import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border transition-colors",
  {
    variants: {
      variant: {
        default: "border-[var(--border-default)] shadow-[var(--shadow-xs)]",
        elevated: "border-[var(--border-soft)] shadow-[var(--shadow-md)]",
        sunken: "border-[var(--border-soft)]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>

function Card({ className, variant, padding, style, ...props }: CardProps) {
  const surface =
    variant === "sunken" ? "var(--surface-sunken)" : "var(--surface-card)"
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      style={{ background: surface, ...style }}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-heading text-lg font-semibold leading-tight tracking-tight",
        className
      )}
      style={{ color: "var(--text-primary)" }}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm leading-relaxed", className)}
      style={{ color: "var(--text-secondary)" }}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cn("mt-4 first:mt-0", className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-5 flex items-center gap-2 pt-4 border-t",
        className
      )}
      style={{ borderColor: "var(--border-soft)" }}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
}
