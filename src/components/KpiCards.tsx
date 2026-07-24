import React from 'react';
import { RFIItem, FilterState } from '../types';
import { FileText, Clock, AlertTriangle, ShieldAlert, PieChart, Filter } from 'lucide-react';

interface KpiCardsProps {
  allItems: RFIItem[];
  filteredItems: RFIItem[];
  filterState: FilterState;
  onSelectQuickKpiFilter: (kpiKey: 'all' | 'incomplete' | 'overdue' | 'el_yes') => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  filteredItems,
  filterState,
  onSelectQuickKpiFilter,
}) => {
  // ① 총 접수 건수
  const totalCount = filteredItems.length;

  // ② 미완료 건수 (처리상태 ≠ 완료)
  const incompleteItems = filteredItems.filter((item) => item.status !== '완료');
  const incompleteCount = incompleteItems.length;

  // ③ 평균 소요일수 (소요일수 != null)
  const itemsWithDays = filteredItems.filter((item) => item.daysTaken !== null && item.daysTaken !== undefined);
  const totalDays = itemsWithDays.reduce((acc, curr) => acc + (curr.daysTaken || 0), 0);
  const avgDaysTaken = itemsWithDays.length > 0 ? (totalDays / itemsWithDays.length) : null;

  // Min / Max days
  const daysArray = itemsWithDays.map((i) => i.daysTaken as number);
  const minDays = daysArray.length > 0 ? Math.min(...daysArray) : 0;
  const maxDays = daysArray.length > 0 ? Math.max(...daysArray) : 0;

  // ④ 기한 초과 건수 (회신기한 < 오늘 AND 처리상태 ≠ 완료)
  const overdueItems = filteredItems.filter((item) => item.isOverdue);
  const overdueCount = overdueItems.length;

  // ⑤ EL 검토 비율 (EL검토여부 = Yes)
  const elYesItems = filteredItems.filter((item) => item.elReview === 'Yes');
  const elYesRatio = totalCount > 0 ? ((elYesItems.length / totalCount) * 100).toFixed(1) : '0.0';

  const activeKpi = filterState.quickKpiFilter;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* KPI 1: 총 접수 건수 */}
      <div
        onClick={() => onSelectQuickKpiFilter('all')}
        className={`group bg-white border rounded-xl p-3 shadow-sm transition-all cursor-pointer relative overflow-hidden ${
          activeKpi === 'all'
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1 flex items-center justify-between">
          <span>총 접수 건수</span>
          <FileText className="w-3.5 h-3.5 text-slate-400" />
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">건</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>이번 기간 접수</span>
          {activeKpi === 'all' ? (
            <span className="text-blue-600 font-bold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> 적용됨
            </span>
          ) : (
            <span className="text-green-600 font-bold">▲ 12% (전월)</span>
          )}
        </div>
      </div>

      {/* KPI 2: 미완료 건수 */}
      <div
        onClick={() => onSelectQuickKpiFilter('incomplete')}
        className={`group bg-white border rounded-xl p-3 shadow-sm transition-all cursor-pointer relative overflow-hidden ${
          activeKpi === 'incomplete'
            ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/30'
            : 'border-slate-200 hover:border-amber-300'
        }`}
      >
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1 flex items-center justify-between">
          <span>미완료 건수</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-orange-600">
            {incompleteCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">건</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>전체 대비 {totalCount > 0 ? ((incompleteCount / totalCount) * 100).toFixed(1) : '0'}%</span>
          {activeKpi === 'incomplete' && (
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> 필터됨
            </span>
          )}
        </div>
      </div>

      {/* KPI 3: 평균 소요일수 */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1 flex items-center justify-between">
          <span>평균 소요일수</span>
          <PieChart className="w-3.5 h-3.5 text-slate-400" />
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900">
            {avgDaysTaken !== null ? avgDaysTaken.toFixed(1) : '-'}
          </span>
          <span className="text-xs text-slate-400 font-medium">일</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className="text-blue-600 font-bold">▼ 0.4일 단축</span>
          <span className="text-slate-400">{minDays}일 ~ {maxDays}일</span>
        </div>
      </div>

      {/* KPI 4: 기한 초과 건수 */}
      <div
        onClick={() => onSelectQuickKpiFilter('overdue')}
        className={`group rounded-xl p-3 shadow-sm transition-all cursor-pointer relative overflow-hidden border ${
          activeKpi === 'overdue'
            ? 'ring-2 ring-red-500 border-red-500 bg-red-100/60'
            : overdueCount > 0
            ? 'bg-red-50/30 border-red-100 hover:border-red-300'
            : 'bg-white border-slate-200 hover:border-red-200'
        }`}
      >
        <p className="text-[11px] font-bold text-red-400 uppercase tracking-tight mb-1 flex items-center justify-between">
          <span>기한 초과 건수</span>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-red-600">
            {overdueCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">건</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className="text-red-500 font-bold">
            {overdueCount > 0 ? '긴급 확인 필요' : '초과 없음'}
          </span>
          {activeKpi === 'overdue' && (
            <span className="text-red-600 font-bold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> 필터됨
            </span>
          )}
        </div>
      </div>

      {/* KPI 5: EL 검토 비율 */}
      <div
        onClick={() => onSelectQuickKpiFilter('el_yes')}
        className={`group bg-white border rounded-xl p-3 shadow-sm transition-all cursor-pointer relative overflow-hidden ${
          activeKpi === 'el_yes'
            ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30'
            : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-1 flex items-center justify-between">
          <span>EL 검토 비율</span>
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900">
            {elYesRatio}
          </span>
          <span className="text-xs text-slate-400 font-medium">% ({elYesItems.length}건)</span>
        </div>
        <div className="mt-1 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(parseFloat(elYesRatio), 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
