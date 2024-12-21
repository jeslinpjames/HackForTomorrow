// src/components/ui/alert.jsx
import React from 'react';
import clsx from 'clsx';

export function Alert({ children, variant = "default", className }) {
  const variants = {
    default: "bg-blue-50 text-blue-800 border-blue-200",
    destructive: "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-2 border rounded-lg p-4",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children }) {
  return <div className="text-sm">{children}</div>;
}
