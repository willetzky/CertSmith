import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <textarea
        className={`w-full bg-slate-800 border border-slate-700 rounded-md p-3 text-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`}
        {...props}
      />
    </div>
  );
};
