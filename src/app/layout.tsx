import type React from "react"
import type { Metadata } from "next"
import ClientRootLayout from "./ClientRootLayout"

export const metadata: Metadata = {
  title: "I AM CFO - Financial Dashboard",
  description: "Comprehensive financial management and reporting dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientRootLayout>{children}</ClientRootLayout>
}
