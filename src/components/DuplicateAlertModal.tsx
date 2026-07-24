import React from 'react';
import { DuplicateAlert } from '../types';
import { AlertTriangle, X, Copy } from 'lucide-react';

interface DuplicateAlertModalProps {
  alert: DuplicateAlert;
  onClose: () => void;
}

export const DuplicateAlertModal: React.FC<DuplicateAlertModalProps> = ({ alert, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">중복 질의ID 감지</h3>
              <p className="text-xs text-slate-500">
                총 <strong className="text-rose-600 font-bold">{alert.totalDuplicates}</strong>개의 중복 질의ID가 발견되었습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 bg-rose-50/60 rounded-xl p-3 border border-rose-100">
          <p className="text-xs text-rose-800 font-medium mb-2 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" /> 중복 발견된 질의ID 목록:
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-rose-700 font-mono pr-1">
            {alert.duplicateIds.map((id, idx) => (
              <div key={idx} className="bg-white px-2.5 py-1 rounded-md border border-rose-200 shadow-2xs">
                {id}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          * 원본 파일에 동일한 질의ID가 중복 포함되어 있습니다. 집계 대시보드에는 모든 데이터가 정상 로드되었으나, 정밀한 통계를 위해 원본 파일의 질의ID 중복 제거를 권장합니다.
        </p>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            확인 및 계속
          </button>
        </div>
      </div>
    </div>
  );
};
