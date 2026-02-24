import React from "react";

// Helper component for printing textareas correctly
export const PrintableTextarea = ({ value, onChange, placeholder, className, minHeight = "2rem", disabled = false, rows = 1, readOnly = false }: any) => (
  <div className="relative w-full">
    {!readOnly && (
      <textarea
        className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden print:hidden ${className}`}
        style={{ minHeight }}
        value={value}
        onChange={(e) => {
          onChange(e);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
      />
    )}
    <div 
        className={`${!readOnly ? 'hidden print:block' : 'block print:block'} whitespace-pre-wrap ${className}`} 
        style={{ minHeight, border: 'none', outline: 'none' }}
    >
      {value}
    </div>
  </div>
);

// Helper component for printing inputs correctly
export const PrintableInput = ({ value, onChange, placeholder, className, type = "text", readOnly = false }: any) => (
  <div className="relative w-full">
    {!readOnly && (
      <input
        type={type}
        className={`w-full bg-transparent border-none outline-none print:hidden ${className}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    )}
    <div 
        className={`${!readOnly ? 'hidden print:flex' : 'flex print:flex'} items-center ${className}`} 
        style={{ border: 'none', outline: 'none', minHeight: '1.5rem' }}
    >
      {value}
    </div>
  </div>
);
