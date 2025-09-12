// src/components/ui/button.tsx
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: "default" | "outline";
};

export function Button({
  children,
  className = "",
  variant = "default",
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded-md font-medium transition";
  const styles =
    variant === "outline"
      ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
      : "bg-[#3CA9E0] text-white hover:bg-[#2B91C0]";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
