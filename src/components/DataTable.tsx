import React, { useState, useMemo } from 'react';
import { RFIItem } from '../types';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface DataTableProps {
  items: RFIItem[];
  onExportExcel: () => void;
  onExportCsv: () => void;
}

type SortField = keyof RFIItem;
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({ items, onExportExcel, onExportCsv }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('receiptDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filtered & Search items
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      return (
        item.id.toLowerCase().includes(q) ||
        item.customerCode.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.targetSystem.toLowerCase().includes(q) ||
        item.queryType.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.securityLevel.toLowerCase().includes(q) ||
        item.receiptDate.toLowerCase().includes(q) ||
        item.replyDeadline.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  // Sorted items
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === null || valA === undefined || valA === '미입력' || valA === '미분류') valA = '';
      if (valB === null || valB === undefined || valB === '미입력' || valB === '미분류') valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA);
      const strB = String(valB);
      return sortOrder === 'asc'
        ? strA.localeCompare(strB, 'ko')
        : strB.localeCompare(strA, 'ko');
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginated items
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '완료':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '검토중':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '접수':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '회신대기':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
      {/* Table Header Control Bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            RFI 상세 목록
          </h2>
          <span className="text-[11px] text-slate-400">
            (총 <strong className="text-slate-700 font-bold">{filteredData.length.toLocaleString()}</strong>건)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="검색어 입력..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Export Buttons */}
          <button
            onClick={onExportCsv}
            className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
            title="CSV 다운로드"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={onExportExcel}
            className="px-2 py-1 text-[10px] font-bold text-green-700 bg-white border border-green-200 rounded hover:bg-green-50 transition-colors cursor-pointer flex items-center gap-1"
            title="Excel 다운로드"
          >
            <FileSpreadsheet className="w-3 h-3 text-green-600" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-tight border-b border-slate-200 select-none">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                질의ID {renderSortIcon('id')}
              </th>
              <th
                onClick={() => handleSort('receiptDate')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                접수일 {renderSortIcon('receiptDate')}
              </th>
              <th
                onClick={() => handleSort('replyDeadline')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                회신기한 {renderSortIcon('replyDeadline')}
              </th>
              <th className="py-2 px-3 font-bold">기한 상태</th>
              <th
                onClick={() => handleSort('country')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                국가 {renderSortIcon('country')}
              </th>
              <th
                onClick={() => handleSort('customerCode')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                고객코드 {renderSortIcon('customerCode')}
              </th>
              <th
                onClick={() => handleSort('targetSystem')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                대상체계 {renderSortIcon('targetSystem')}
              </th>
              <th
                onClick={() => handleSort('queryType')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                질의유형 {renderSortIcon('queryType')}
              </th>
              <th
                onClick={() => handleSort('department')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                담당부서 {renderSortIcon('department')}
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                처리상태 {renderSortIcon('status')}
              </th>
              <th
                onClick={() => handleSort('elReview')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                EL검토 {renderSortIcon('elReview')}
              </th>
              <th
                onClick={() => handleSort('securityLevel')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group font-bold"
              >
                보안등급 {renderSortIcon('securityLevel')}
              </th>
              <th
                onClick={() => handleSort('daysTaken')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group text-right font-bold"
              >
                소요일수 {renderSortIcon('daysTaken')}
              </th>
              <th
                onClick={() => handleSort('revisionCount')}
                className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition-colors group text-right font-bold"
              >
                수정횟수 {renderSortIcon('revisionCount')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    <span>조회된 RFI 데이터가 없습니다.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id + '_' + index}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                    {item.receiptDate}
                  </td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                    {item.replyDeadline}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {item.isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" /> 초과({item.remainingDays}일)
                      </span>
                    ) : item.remainingDays !== null ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" /> {item.remainingDays}일 남음
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {item.country}
                  </td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                    {item.customerCode}
                  </td>
                  <td className="py-2 px-3 text-slate-800 font-medium whitespace-nowrap">
                    {item.targetSystem}
                  </td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                    {item.queryType}
                  </td>
                  <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                    {item.department}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {item.elReview === 'Yes' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <ShieldAlert className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium border border-slate-200">
                      {item.securityLevel}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                    {item.daysTaken !== null ? `${item.daysTaken}일` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 whitespace-nowrap">
                    {item.revisionCount !== null ? `${item.revisionCount}회` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer */}
      <div className="px-4 py-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50/50 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span>페이지 당:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value={10}>10개</option>
            <option value={25}>25개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={validCurrentPage === 1}
            className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-slate-700 px-1">
            {validCurrentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={validCurrentPage >= totalPages}
            className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
