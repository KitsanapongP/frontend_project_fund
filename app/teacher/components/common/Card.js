// Card.js - Reusable Card Component
"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Card({ 
  title, 
  children, 
  defaultCollapsed = false,
  icon: Icon,
  action,
  className = "",
  collapsible = true,
  headerClassName = "",
  bodyClassName = ""
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  const handleToggle = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div 
        className={`p-5 border-b border-gray-200 flex justify-between items-center ${
          collapsible ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${headerClassName}`}
        onClick={handleToggle}
      >
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {Icon && <Icon size={20} className="text-gray-600" />}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {action && (
            <div onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
          {collapsible && (
            <button 
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className={`p-6 ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}