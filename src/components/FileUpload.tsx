import React, { useState, useRef, useCallback } from 'react';
import { CloudUpload, FileText, X } from 'lucide-react';
import { cn } from '../lib/cn';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  label: string;
}

export function FileUpload({ onFileSelected, accept = '.xlsx,.xls,.csv', label }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/40',
        dragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
        tabIndex={-1}
      />
      {fileName ? (
        <div className="flex items-center justify-center gap-3">
          <FileText size={24} className="text-blue-600" />
          <span className="font-semibold text-slate-700">{fileName}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFileName(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-1 hover:bg-slate-200 rounded"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>
      ) : (
        <div>
          <CloudUpload size={36} className="mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-slate-600">{label}</p>
          <p className="text-xs text-slate-400 mt-1">
            Drag & drop or click to browse — .xlsx, .xls, or .csv
          </p>
        </div>
      )}
    </div>
  );
}
