/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RFIItem, FilterState, DuplicateAlert } from './types';
import { RAW_SAMPLE_DATA } from './data/sampleData';
import { processRawRowObject, parseExcelFile, exportRfiToExcel, exportRfiToCsv } from './utils/excelParser';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { AIAnalysisCard } from './components/AIAnalysisCard';
import { FilterSidebar } from './components/FilterSidebar';
import { ChartsSection } from './components/ChartsSection';
import { DataTable } from './components/DataTable';
import { DuplicateAlertModal } from './components/DuplicateAlertModal';
import { FileSpreadsheet, Info } from 'lucide-react';

const INITIAL_FILTER_STATE: FilterState = {
  datePreset: 'all',
  dateRange: { start: '', end: '' },
  countries: [],
  customerCodes: [],
  targetSystems: [],
  queryTypes: [],
  departments: [],
  statuses: [],
  elReviews: [],
  securityLevels: [],
  searchQuery: '',
  quickKpiFilter: null,
};

export default function App() {
  const [fileName, setFileName] = useState<string>('RFI_기본_샘플_데이터.xlsx');
  const [allItems, setAllItems] = useState<RFIItem[]>([]);
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [duplicateAlert, setDuplicateAlert] = useState<DuplicateAlert | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize with sample data on mount
  useEffect(() => {
    const today = new Date();
    const seenIds = new Set<string>();
    const dupes = new Set<string>();

    const items = RAW_SAMPLE_DATA.map((row, idx) => {
      const item = processRawRowObject(row, idx, today);
      if (seenIds.has(item.id)) {
        dupes.add(item.id);
      } else {
        seenIds.add(item.id);
      }
      return item;
    });

    setAllItems(items);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Excel File Upload Handler
  const handleFileUpload = async (file: File) => {
    try {
      const { items, duplicates } = await parseExcelFile(file);
      setAllItems(items);
      setFileName(file.name);
      setFilterState(INITIAL_FILTER_STATE);

      if (duplicates) {
        setDuplicateAlert(duplicates);
      } else {
        showToast(`'${file.name}' (${items.length}건) 업로드 완료`);
      }
    } catch (err: any) {
      showToast(err || '엑셀 파싱 중 오류가 발생했습니다.', 'error');
    }
  };

  // Sample File Download
  const handleDownloadSample = () => {
    const today = new Date();
    const items = RAW_SAMPLE_DATA.map((row, idx) => processRawRowObject(row, idx, today));
    exportRfiToExcel(items, 'RFI_기술질의_샘플서식.xlsx');
    showToast('샘플 서식이 다운로드 되었습니다.');
  };

  // Refresh
  const handleRefresh = () => {
    showToast('대시보드 데이터가 새로고침 되었습니다.');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterState(INITIAL_FILTER_STATE);
    showToast('모든 조회 필터가 초기화 되었습니다.');
  };

  // Quick KPI Card click handler
  const handleSelectQuickKpiFilter = (kpiKey: 'all' | 'incomplete' | 'overdue' | 'el_yes') => {
    if (kpiKey === filterState.quickKpiFilter || kpiKey === 'all') {
      setFilterState({ ...filterState, quickKpiFilter: null });
    } else {
      setFilterState({ ...filterState, quickKpiFilter: kpiKey });
    }
  };

  // Filter Logic
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Date Range Filter
      if (filterState.dateRange.start) {
        if (item.receiptDate === '미입력' || item.receiptDate < filterState.dateRange.start) {
          return false;
        }
      }
      if (filterState.dateRange.end) {
        if (item.receiptDate === '미입력' || item.receiptDate > filterState.dateRange.end) {
          return false;
        }
      }

      // Countries
      if (filterState.countries.length > 0 && !filterState.countries.includes(item.country)) {
        return false;
      }

      // Customer Codes
      if (filterState.customerCodes.length > 0 && !filterState.customerCodes.includes(item.customerCode)) {
        return false;
      }

      // Target Systems
      if (filterState.targetSystems.length > 0 && !filterState.targetSystems.includes(item.targetSystem)) {
        return false;
      }

      // Query Types
      if (filterState.queryTypes.length > 0 && !filterState.queryTypes.includes(item.queryType)) {
        return false;
      }

      // Departments
      if (filterState.departments.length > 0 && !filterState.departments.includes(item.department)) {
        return false;
      }

      // Statuses
      if (filterState.statuses.length > 0 && !filterState.statuses.includes(item.status)) {
        return false;
      }

      // EL Reviews
      if (filterState.elReviews.length > 0 && !filterState.elReviews.includes(item.elReview)) {
        return false;
      }

      // Security Levels
      if (filterState.securityLevels.length > 0 && !filterState.securityLevels.includes(item.securityLevel)) {
        return false;
      }

      // Quick KPI Filter
      if (filterState.quickKpiFilter === 'incomplete' && item.status === '완료') {
        return false;
      }
      if (filterState.quickKpiFilter === 'overdue' && !item.isOverdue) {
        return false;
      }
      if (filterState.quickKpiFilter === 'el_yes' && item.elReview !== 'Yes') {
        return false;
      }

      return true;
    });
  }, [allItems, filterState]);

  const hasActiveFilters =
    filterState.countries.length > 0 ||
    filterState.customerCodes.length > 0 ||
    filterState.targetSystems.length > 0 ||
    filterState.queryTypes.length > 0 ||
    filterState.departments.length > 0 ||
    filterState.statuses.length > 0 ||
    filterState.elReviews.length > 0 ||
    filterState.securityLevels.length > 0 ||
    filterState.datePreset !== 'all' ||
    Boolean(filterState.dateRange.start) ||
    Boolean(filterState.dateRange.end) ||
    Boolean(filterState.quickKpiFilter);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-800'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <Info className="w-4 h-4 text-blue-400" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Duplicate Alert Modal */}
      {duplicateAlert && (
        <DuplicateAlertModal
          alert={duplicateAlert}
          onClose={() => setDuplicateAlert(null)}
        />
      )}

      {/* Top Header */}
      <Header
        fileName={fileName}
        totalRecords={allItems.length}
        filteredRecords={filteredItems.length}
        onFileUpload={handleFileUpload}
        onDownloadSample={handleDownloadSample}
        onRefresh={handleRefresh}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 space-y-4">
        {/* KPI Summary Cards */}
        <KpiCards
          allItems={allItems}
          filteredItems={filteredItems}
          filterState={filterState}
          onSelectQuickKpiFilter={handleSelectQuickKpiFilter}
        />

        {/* AI Analysis & Commentary Section */}
        <AIAnalysisCard
          filteredItems={filteredItems}
          allItems={allItems}
        />

        {/* Main Content Area: Sidebar + Charts & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-1">
            <FilterSidebar
              filterState={filterState}
              onFilterChange={setFilterState}
              onResetFilters={handleResetFilters}
              allItems={allItems}
            />
          </div>

          {/* Right Main Analytics Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Visual Charts */}
            <ChartsSection filteredItems={filteredItems} />

            {/* Data Table */}
            <DataTable
              items={filteredItems}
              onExportExcel={() => exportRfiToExcel(filteredItems, `RFI_집계목록_${new Date().toISOString().slice(0, 10)}.xlsx`)}
              onExportCsv={() => exportRfiToCsv(filteredItems, `RFI_집계목록_${new Date().toISOString().slice(0, 10)}.csv`)}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 inline" />
            <span>기술질의(RFI) 운영 대시보드 System</span>
          </p>
          <p className="text-slate-400">
            자동 집계 • 다중 필터 시각화 • AI 가공 분석
          </p>
        </div>
      </footer>
    </div>
  );
}
