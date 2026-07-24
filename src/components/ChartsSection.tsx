import React, { useState, useMemo } from 'react';
import { RFIItem } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { TrendingUp, Globe2, BarChart2, CalendarRange, Info } from 'lucide-react';

interface ChartsSectionProps {
  filteredItems: RFIItem[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ filteredItems }) => {
  const [timeGrain, setTimeGrain] = useState<'month' | 'week'>('month');

  // Chart 1 Data: 접수 추이 (Line Chart)
  const trendData = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredItems.forEach((item) => {
      let key = '미입력';
      if (timeGrain === 'month') {
        key = item.receiptMonth !== '미입력' ? item.receiptMonth : '미입력';
      } else {
        key = item.receiptWeek !== '미입력' ? item.receiptWeek : '미입력';
      }

      if (key !== '미입력') {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const sortedKeys = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((k) => ({
      dateKey: k,
      count: counts[k],
    }));
  }, [filteredItems, timeGrain]);

  // Chart 2 Data: 국가별 질의 건수 (Horizontal Bar Chart)
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredItems.forEach((item) => {
      const country = item.country || '미분류';
      counts[country] = (counts[country] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count); // Descending order
  }, [filteredItems]);

  // Chart 3 Data: 처리상태 분포 (Bar Chart)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredItems.forEach((item) => {
      const status = item.status || '미분류';
      counts[status] = (counts[status] || 0) + 1;
    });

    // Custom order preference if available
    const preferredOrder = ['접수', '검토중', '회신대기', '완료', '보류', '미분류'];
    const entries = Object.entries(counts).map(([status, count]) => ({ status, count }));

    entries.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.status);
      const idxB = preferredOrder.indexOf(b.status);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b.count - a.count;
    });

    return entries;
  }, [filteredItems]);

  const isEmpty = filteredItems.length === 0;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label, unit = '건' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 text-white text-xs rounded-lg p-2.5 shadow-xl border border-slate-700 backdrop-blur-xs">
          <p className="font-semibold text-slate-200">{label}</p>
          <p className="mt-1 font-bold text-blue-400">
            {payload[0].value.toLocaleString()} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const STATUS_COLORS: Record<string, string> = {
    '접수': '#3b82f6', // blue
    '검토중': '#f59e0b', // amber
    '회신대기': '#8b5cf6', // purple
    '완료': '#10b981', // emerald
    '보류': '#64748b', // slate
    '미분류': '#94a3b8'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: 접수 추이 (Line Chart) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">월별 접수 추이</h3>
              <p className="text-[11px] text-slate-400">시점별 RFI 질의 발생 건수</p>
            </div>
          </div>

          {/* Time Grain Toggle */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
            <button
              onClick={() => setTimeGrain('month')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                timeGrain === 'month'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              월별
            </button>
            <button
              onClick={() => setTimeGrain('week')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                timeGrain === 'week'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              주차별
            </button>
          </div>
        </div>

        {isEmpty || trendData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Info className="w-5 h-5 mb-1.5 text-slate-300" />
            <p className="text-xs font-medium">추이 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dateKey" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 5.5, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: 국가별 질의 건수 (Horizontal Bar Chart) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">국가별 질의 건수</h3>
            <p className="text-[11px] text-slate-400">건수 내림차순 정렬</p>
          </div>
        </div>

        {isEmpty || countryData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Info className="w-5 h-5 mb-1.5 text-slate-300" />
            <p className="text-xs font-medium">국가별 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={countryData}
                margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="country" type="category" width={75} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 3: 처리상태 분포 (Bar Chart) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">처리상태 분포</h3>
            <p className="text-[11px] text-slate-400">단계별 RFI 처리 상태</p>
          </div>
        </div>

        {isEmpty || statusData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Info className="w-5 h-5 mb-1.5 text-slate-300" />
            <p className="text-xs font-medium">처리상태 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
