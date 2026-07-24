import React, { useRef } from 'react';
import { Upload, RefreshCw, RotateCcw, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  fileName: string;
  totalRecords: number;
  filteredRecords: number;
  onFileUpload: (file: File) => void;
  onDownloadSample: () => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  totalRecords,
  filteredRecords,
  onFileUpload,
  onDownloadSample,
  onRefresh,
  onResetFilters,
  hasActiveFilters,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset input value so same file re-upload works
      e.target.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Title & Metadata */}
        <div className="flex items-center gap-3">
          <span className="p-1.5 bg-blue-600 rounded text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                기술질의(RFI) 운영 대시보드
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                실시간 집계중
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>데이터 원본: <strong className="text-slate-700 font-medium">{fileName}</strong></span>
              <span className="text-slate-300">•</span>
              <span>총 <strong className="text-slate-800">{totalRecords.toLocaleString()}</strong>건</span>
              {totalRecords !== filteredRecords && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-[11px]">
                    필터 적용: {filteredRecords.toLocaleString()}건
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            title="엑셀 파일(.xlsx) 업로드"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel 업로드</span>
          </button>

          <button
            onClick={onDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            title="샘플 양식 서식 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">샘플 서식</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            title="데이터 새로고침"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">새로고침</span>
          </button>

          <button
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-colors cursor-pointer ${
              hasActiveFilters
                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                : 'text-slate-400 bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
            }`}
            title="현재 적용된 필터 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>필터 초기화</span>
          </button>
        </div>
      </div>
    </header>
  );
};
