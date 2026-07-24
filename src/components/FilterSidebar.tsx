import React, { useState } from 'react';
import { FilterState, RFIItem } from '../types';
import { Filter, X, Calendar, Search, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';

interface FilterSidebarProps {
  filterState: FilterState;
  onFilterChange: (newFilterState: FilterState) => void;
  onResetFilters: () => void;
  allItems: RFIItem[];
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  allItems,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    date: true,
    country: true,
    customerCode: false,
    targetSystem: false,
    queryType: false,
    department: true,
    status: true,
    elReview: false,
    securityLevel: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Helper to extract unique options for multi-select
  const getUniqueOptions = (field: keyof RFIItem) => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      const val = item[field];
      if (val !== undefined && val !== null && val !== '') {
        set.add(String(val));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  };

  const countries = getUniqueOptions('country');
  const customerCodes = getUniqueOptions('customerCode');
  const targetSystems = getUniqueOptions('targetSystem');
  const queryTypes = getUniqueOptions('queryType');
  const departments = getUniqueOptions('department');
  const statuses = getUniqueOptions('status');
  const elReviews = ['Yes', 'No', '미입력'];
  const securityLevels = getUniqueOptions('securityLevel');

  // Toggle single item in multi-select array
  const toggleArrayItem = (listName: keyof FilterState, item: string) => {
    const currentList = (filterState[listName] as string[]) || [];
    const exists = currentList.includes(item);
    const updatedList = exists
      ? currentList.filter((x) => x !== item)
      : [...currentList, item];

    onFilterChange({
      ...filterState,
      [listName]: updatedList,
    });
  };

  // Select all or clear array
  const setAllItems = (listName: keyof FilterState, allValues: string[], selectAll: boolean) => {
    onFilterChange({
      ...filterState,
      [listName]: selectAll ? allValues : [],
    });
  };

  // Quick Date presets
  const handleDatePreset = (preset: FilterState['datePreset']) => {
    if (preset === 'all') {
      onFilterChange({
        ...filterState,
        datePreset: 'all',
        dateRange: { start: '', end: '' },
      });
      return;
    }

    const today = new Date();
    let startDate = new Date();

    if (preset === '1m') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (preset === '3m') {
      startDate.setMonth(today.getMonth() - 3);
    } else if (preset === '6m') {
      startDate.setMonth(today.getMonth() - 6);
    } else if (preset === 'this_year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    }

    const format = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    onFilterChange({
      ...filterState,
      datePreset: preset,
      dateRange: {
        start: format(startDate),
        end: format(today),
      },
    });
  };

  // Count active filter conditions
  const activeCount =
    filterState.countries.length +
    filterState.customerCodes.length +
    filterState.targetSystems.length +
    filterState.queryTypes.length +
    filterState.departments.length +
    filterState.statuses.length +
    filterState.elReviews.length +
    filterState.securityLevels.length +
    (filterState.datePreset !== 'all' || filterState.dateRange.start || filterState.dateRange.end ? 1 : 0) +
    (filterState.quickKpiFilter ? 1 : 0);

  // Helper render multi-checkbox section
  const renderMultiSelectSection = (
    title: string,
    sectionKey: string,
    listName: keyof FilterState,
    options: string[]
  ) => {
    const selectedList = (filterState[listName] as string[]) || [];
    const isOpen = openSections[sectionKey];

    return (
      <div className="border-b border-slate-200 py-3">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-blue-600 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span>{title}</span>
            {selectedList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded-full font-extrabold">
                {selectedList.length}
              </span>
            )}
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {isOpen && (
          <div className="mt-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
            {/* All / None toggles */}
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 text-[11px] text-slate-500">
              <button
                onClick={() => setAllItems(listName, options, true)}
                className="hover:text-blue-600 font-medium cursor-pointer"
              >
                전체 선택
              </button>
              <button
                onClick={() => setAllItems(listName, options, false)}
                className="hover:text-rose-600 font-medium cursor-pointer"
              >
                전체 해제
              </button>
            </div>

            {options.map((option) => {
              const isChecked = selectedList.includes(option);
              return (
                <label
                  key={option}
                  className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors cursor-pointer select-none ${
                    isChecked ? 'bg-blue-50/70 text-blue-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{option}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayItem(listName, option)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-3">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 shadow-xs cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>상세 필터 검색</span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                {activeCount}
              </span>
            )}
          </span>
          {isOpenMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Filter Sidebar Container */}
      <aside
        className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden transition-all ${
          isOpenMobile ? 'block' : 'hidden lg:block'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>데이터 필터링</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">
                {activeCount}
              </span>
            )}
          </h2>
          {activeCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          )}
        </div>

        {/* Filters Scroll Area */}
        <div className="p-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          {/* Date Filter Section */}
          <div className="space-y-2 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>조회 기간</span>
              </label>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'all', label: '전체' },
                { id: '1m', label: '1개월' },
                { id: '3m', label: '3개월' },
                { id: '6m', label: '6개월' },
                { id: 'this_year', label: '올해' },
                { id: 'custom', label: '직접선택' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleDatePreset(p.id as FilterState['datePreset'])}
                  className={`py-1 px-1.5 text-[11px] font-medium rounded border text-center transition-all cursor-pointer ${
                    filterState.datePreset === p.id
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">시작일</label>
                <input
                  type="date"
                  value={filterState.dateRange.start}
                  onChange={(e) =>
                    onFilterChange({
                      ...filterState,
                      datePreset: 'custom',
                      dateRange: { ...filterState.dateRange, start: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-0.5">종료일</label>
                <input
                  type="date"
                  value={filterState.dateRange.end}
                  onChange={(e) =>
                    onFilterChange({
                      ...filterState,
                      datePreset: 'custom',
                      dateRange: { ...filterState.dateRange, end: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Multi-Select Filter Sections */}
          {renderMultiSelectSection('국가', 'country', 'countries', countries)}
          {renderMultiSelectSection('고객코드', 'customerCode', 'customerCodes', customerCodes)}
          {renderMultiSelectSection('대상체계', 'targetSystem', 'targetSystems', targetSystems)}
          {renderMultiSelectSection('질의유형', 'queryType', 'queryTypes', queryTypes)}
          {renderMultiSelectSection('담당부서', 'department', 'departments', departments)}
          {renderMultiSelectSection('처리상태', 'status', 'statuses', statuses)}
          {renderMultiSelectSection('EL 검토', 'elReview', 'elReviews', elReviews)}
          {renderMultiSelectSection('보안등급', 'securityLevel', 'securityLevels', securityLevels)}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onResetFilters}
            className="w-full py-2 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            필터 초기화
          </button>
        </div>
      </aside>
    </>
  );
};
