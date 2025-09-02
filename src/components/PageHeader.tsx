import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children, right }: PageHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative flex justify-center">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            {children}
          </div>
          {right && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">{right}</div>
          )}
        </div>
      </div>
    </div>
  );
}
