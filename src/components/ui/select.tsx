//src/components/ui/select.tsx

import * as React from "react";
import cn from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          // temel
          "w-full appearance-none rounded-xl border bg-white/90 px-4 py-3 pr-10",
          "border-gray-200 text-gray-900 placeholder:text-gray-400",
          // durumlar
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:border-gray-300",
          "hover:border-gray-300",
          "disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>

      {/* ok ikonu */}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M5.25 7.5l4.5 4.5 4.5-4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
