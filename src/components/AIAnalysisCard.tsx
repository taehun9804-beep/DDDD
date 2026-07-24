import React, { useState, useEffect, useCallback } from 'react';
import { RFIItem, AIAnalysisResult } from '../types';
import { Sparkles, AlertCircle, TrendingUp, RefreshCw, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface AIAnalysisCardProps {
  filteredItems: RFIItem[];
  allItems: RFIItem[];
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ filteredItems, allItems }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isAiPowered, setIsAiPowered] = useState<boolean>(false);

  // Fallback Rule-Based Fact Generator (Strictly facts derived from data)
  const generateFactBasedAnalysis = useCallback((items: RFIItem[]): AIAnalysisResult => {
    if (items.length === 0) {
      return {
        majorChanges: ['현재 적용된 필터 조건에 해당하는 접수 데이터가 없습니다.'],
        warningItems: ['분석할 데이터가 존재하지 않습니다. 필터 조건을 변경해 주세요.'],
        summaryText: '조회 데이터 없음',
        generatedAt: new Date().toLocaleTimeString('ko-KR')
      };
    }

    const totalCount = items.length;
    const incompleteItems = items.filter((i) => i.status !== '완료');
    const incompleteCount = incompleteItems.length;
    const completedItems = items.filter((i) => i.status === '완료');
    const overdueCount = items.filter((i) => i.isOverdue).length;

    const itemsWithDays = items.filter((i) => i.daysTaken !== null);
    const avgDays = itemsWithDays.length > 0
      ? itemsWithDays.reduce((sum, curr) => sum + (curr.daysTaken || 0), 0) / itemsWithDays.length
      : null;

    const elYesCount = items.filter((i) => i.elReview === 'Yes').length;
    const elRatio = ((elYesCount / totalCount) * 100).toFixed(1);

    // Country distribution
    const countryCounts: Record<string, number> = {};
    items.forEach((i) => {
      countryCounts[i.country] = (countryCounts[i.country] || 0) + 1;
    });
    const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

    // Department distribution
    const deptCounts: Record<string, number> = {};
    items.forEach((i) => {
      deptCounts[i.department] = (deptCounts[i.department] || 0) + 1;
    });
    const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

    const majorChanges: string[] = [];
    const warningItems: string[] = [];

    // Major changes facts
    majorChanges.push(`총 ${totalCount}건의 질의 중 완료 ${completedItems.length}건, 미완료 ${incompleteCount}건이 집계되었습니다.`);
    if (avgDays !== null) {
      majorChanges.push(`완료된 질의의 평균 처리 소요일수는 ${avgDays.toFixed(1)}일입니다.`);
    }
    majorChanges.push(`전체 질의 중 EL 검토 대상(Yes)은 ${elYesCount}건으로 ${elRatio}%를 차지합니다.`);

    // Warning items facts
    if (overdueCount > 0) {
      warningItems.push(`회신기한이 지난 미처리(기한 초과) 건수가 ${overdueCount}건 존재합니다.`);
    } else {
      warningItems.push(`현재 기한을 초과한 미처리 건수는 0건입니다.`);
    }

    if (sortedCountries.length > 0) {
      const topCountry = sortedCountries[0];
      const countryRatio = ((topCountry[1] / totalCount) * 100).toFixed(1);
      if (parseFloat(countryRatio) >= 30) {
        warningItems.push(`'${topCountry[0]}' 국가의 질의가 ${topCountry[1]}건(${countryRatio}%)으로 비중이 높습니다.`);
      }
    }

    if (sortedDepts.length > 0) {
      const topDept = sortedDepts[0];
      const deptRatio = ((topDept[1] / totalCount) * 100).toFixed(1);
      if (parseFloat(deptRatio) >= 25) {
        warningItems.push(`'${topDept[0]}' 부서의 접수량이 ${topDept[1]}건(${deptRatio}%)으로 접수 집중도가 높습니다.`);
      }
    }

    return {
      majorChanges,
      warningItems,
      summaryText: `총 ${totalCount}건 접수 | 미완료 ${incompleteCount}건 | 기한초과 ${overdueCount}건`,
      generatedAt: new Date().toLocaleTimeString('ko-KR')
    };
  }, []);

  const runAiAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const totalCount = filteredItems.length;
      const incompleteCount = filteredItems.filter((i) => i.status !== '완료').length;
      const overdueCount = filteredItems.filter((i) => i.isOverdue).length;

      const itemsWithDays = filteredItems.filter((i) => i.daysTaken !== null);
      const avgDaysTaken = itemsWithDays.length > 0
        ? itemsWithDays.reduce((sum, curr) => sum + (curr.daysTaken || 0), 0) / itemsWithDays.length
        : null;

      const elYesCount = filteredItems.filter((i) => i.elReview === 'Yes').length;
      const elRatio = totalCount > 0 ? ((elYesCount / totalCount) * 100).toFixed(1) : '0';

      const countryCounts: Record<string, number> = {};
      const deptCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};

      filteredItems.forEach((i) => {
        countryCounts[i.country] = (countryCounts[i.country] || 0) + 1;
        deptCounts[i.department] = (deptCounts[i.department] || 0) + 1;
        statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
      });

      const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalCount,
          incompleteCount,
          avgDaysTaken,
          overdueCount,
          elRatio,
          topCountry,
          topDepartment: topDept,
          countryStats: countryCounts,
          deptStats: deptCounts,
          statusStats: statusCounts
        })
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysis({
          majorChanges: data.analysis.majorChanges || [],
          warningItems: data.analysis.warningItems || [],
          summaryText: data.analysis.summaryText || '',
          generatedAt: data.generatedAt || new Date().toLocaleTimeString('ko-KR')
        });
        setIsAiPowered(true);
      } else {
        // Fallback to strict algorithmic analysis
        setAnalysis(generateFactBasedAnalysis(filteredItems));
        setIsAiPowered(false);
      }
    } catch (err) {
      console.warn('Gemini API call failed, using rule-based analysis fallback:', err);
      setAnalysis(generateFactBasedAnalysis(filteredItems));
      setIsAiPowered(false);
    } finally {
      setLoading(false);
    }
  }, [filteredItems, generateFactBasedAnalysis]);

  useEffect(() => {
    runAiAnalysis();
  }, [filteredItems]);

  return (
    <div className="bg-blue-900 text-white border border-blue-900 rounded-xl shadow-lg p-4 relative overflow-hidden">
      {/* Decorative sparkle in background */}
      <div className="absolute top-0 right-0 p-2 opacity-20 text-4xl pointer-events-none select-none">✨</div>

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-3 border-b border-blue-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shrink-0"></span>
          <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2">
            AI 자동 분석 요약
          </h3>
          {isAiPowered ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Gemini 3.6 Flash
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              규칙 기반
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAiAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded bg-blue-800 hover:bg-blue-700 text-blue-100 border border-blue-700 transition-all cursor-pointer disabled:opacity-50"
            title="AI 분석 새로고침"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '분석 중...' : '갱신'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-blue-300 hover:text-white rounded hover:bg-blue-800/80 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Section 1: 주요 변화 */}
          <div className="space-y-2">
            <div className="text-[11px] text-blue-300 font-bold uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-300" />
              <span>주요 변화</span>
            </div>
            {loading ? (
              <div className="space-y-1.5 py-1">
                <div className="h-3.5 bg-blue-800/60 rounded animate-pulse w-3/4"></div>
                <div className="h-3.5 bg-blue-800/60 rounded animate-pulse w-5/6"></div>
              </div>
            ) : (
              <ul className="space-y-1 text-blue-100 leading-relaxed">
                {analysis?.majorChanges.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 2: 주의 항목 */}
          <div className="space-y-2">
            <div className="text-[11px] text-orange-300 font-bold uppercase flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-orange-300" />
              <span>주의 항목</span>
            </div>
            {loading ? (
              <div className="space-y-1.5 py-1">
                <div className="h-3.5 bg-blue-800/60 rounded animate-pulse w-3/4"></div>
                <div className="h-3.5 bg-blue-800/60 rounded animate-pulse w-5/6"></div>
              </div>
            ) : (
              <ul className="space-y-1 text-blue-100 leading-relaxed">
                {analysis?.warningItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-orange-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
