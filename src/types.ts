export interface RFIItem {
  id: string; // 질의ID
  receiptDate: string; // 접수일 (YYYY-MM-DD or "미입력")
  replyDeadline: string; // 회신기한 (YYYY-MM-DD or "미입력")
  customerCode: string; // 고객코드
  country: string; // 국가
  targetSystem: string; // 대상체계
  queryType: string; // 질의유형
  department: string; // 담당부서
  status: string; // 처리상태 (e.g. 접수, 검토중, 회신대기, 완료, 보류)
  elReview: string; // EL검토여부 ("Yes" | "No" | "미입력")
  securityLevel: string; // 보안등급 (e.g. 일반, 제한, 비밀)
  daysTaken: number | null; // 소요일수
  revisionCount: number | null; // 수정횟수

  // Calculated properties
  isOverdue: boolean; // 회신기한 경과 여부 (회신기한 < 오늘 && 처리상태 !== '완료')
  remainingDays: number | null; // 오늘 기준 남은 일수
  receiptYear: number | null;
  receiptMonth: string; // YYYY-MM
  receiptWeek: string; // YYYY-Www
  rawRowIndex?: number;
}

export interface FilterState {
  datePreset: 'all' | '1m' | '3m' | '6m' | 'this_year' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  countries: string[];
  customerCodes: string[];
  targetSystems: string[];
  queryTypes: string[];
  departments: string[];
  statuses: string[];
  elReviews: string[];
  securityLevels: string[];
  searchQuery: string;
  quickKpiFilter: 'all' | 'incomplete' | 'overdue' | 'el_yes' | null;
}

export interface AIAnalysisResult {
  majorChanges: string[];
  warningItems: string[];
  summaryText: string;
  generatedAt: string;
}

export interface DuplicateAlert {
  duplicateIds: string[];
  totalDuplicates: number;
}
