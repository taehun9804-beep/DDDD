import * as XLSX from 'xlsx';
import { RFIItem, DuplicateAlert } from '../types';

// Normalized key mappings
const COLUMN_MAPPINGS: Record<string, keyof RFIItem | string> = {
  '질의id': 'id',
  '질의 id': 'id',
  'id': 'id',
  'query id': 'id',
  'queryid': 'id',

  '접수일': 'receiptDate',
  '접수 일자': 'receiptDate',
  '접수일자': 'receiptDate',
  'receipt date': 'receiptDate',

  '회신기한': 'replyDeadline',
  '회신 기한': 'replyDeadline',
  '회신일자': 'replyDeadline',
  'reply deadline': 'replyDeadline',

  '고객코드': 'customerCode',
  '고객 코드': 'customerCode',
  'customer code': 'customerCode',

  '국가': 'country',
  '국가명': 'country',
  'country': 'country',

  '대상체계': 'targetSystem',
  '대상 체계': 'targetSystem',
  '체계': 'targetSystem',
  'target system': 'targetSystem',

  '질의유형': 'queryType',
  '질의 유형': 'queryType',
  '유형': 'queryType',
  'query type': 'queryType',

  '담당부서': 'department',
  '담당 부서': 'department',
  '부서': 'department',
  'department': 'department',

  '처리상태': 'status',
  '상태': 'status',
  'status': 'status',

  'el검토여부': 'elReview',
  'el 검토 여부': 'elReview',
  'el검토': 'elReview',
  'el review': 'elReview',

  '보안등급': 'securityLevel',
  '보안 등급': 'securityLevel',
  'security level': 'securityLevel',

  '소요일수': 'daysTaken',
  '소요 일수': 'daysTaken',
  '소요기간': 'daysTaken',
  'days taken': 'daysTaken',

  '수정횟수': 'revisionCount',
  '수정 횟수': 'revisionCount',
  'revision count': 'revisionCount'
};

function normalizeHeader(header: string): string {
  if (!header) return '';
  return String(header).trim().toLowerCase();
}

function parseDateValue(val: any): { formatted: string; dateObj: Date | null } {
  if (val === null || val === undefined || val === '' || val === '미입력') {
    return { formatted: '미입력', dateObj: null };
  }

  let date: Date | null = null;

  if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    // Excel date number
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '미입력') return { formatted: '미입력', dateObj: null };
    
    // Try ISO or standard YYYY-MM-DD format
    const matched = trimmed.match(/^(\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])/);
    if (matched) {
      date = new Date(parseInt(matched[1]), parseInt(matched[2]) - 1, parseInt(matched[3]));
    } else {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        date = d;
      }
    }
  }

  if (!date || isNaN(date.getTime())) {
    return { formatted: '미입력', dateObj: null };
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return { formatted: `${yyyy}-${mm}-${dd}`, dateObj: date };
}

function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '' || val === '미입력' || val === 'N/A') {
    return null;
  }
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function parseTextValue(val: any): string {
  if (val === null || val === undefined) return '미분류';
  const str = String(val).trim();
  return str === '' ? '미분류' : str;
}

// Get ISO Week Number string e.g. "2026-W24"
function getISOWeekString(dateObj: Date | null): string {
  if (!dateObj) return '미입력';
  const target = new Date(dateObj.valueOf());
  const dayNr = (dateObj.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
  const year = dateObj.getFullYear();
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

export function processRawRowObject(rowObj: Record<string, any>, rowIndex: number, todayDate: Date = new Date()): RFIItem {
  const mappedObj: Record<string, any> = {};

  Object.keys(rowObj).forEach((key) => {
    const normKey = normalizeHeader(key);
    const targetKey = COLUMN_MAPPINGS[normKey];
    if (targetKey) {
      mappedObj[targetKey] = rowObj[key];
    } else {
      mappedObj[key] = rowObj[key];
    }
  });

  const rawId = mappedObj.id || mappedObj.질의ID || mappedObj['질의 ID'];
  const id = parseTextValue(rawId !== undefined ? rawId : `RFI-ROW-${rowIndex + 1}`);

  const { formatted: receiptDate, dateObj: receiptDateObj } = parseDateValue(mappedObj.receiptDate);
  const { formatted: replyDeadline, dateObj: replyDeadlineObj } = parseDateValue(mappedObj.replyDeadline);

  const customerCode = parseTextValue(mappedObj.customerCode);
  const country = parseTextValue(mappedObj.country);
  const targetSystem = parseTextValue(mappedObj.targetSystem);
  const queryType = parseTextValue(mappedObj.queryType);
  const department = parseTextValue(mappedObj.department);
  const status = parseTextValue(mappedObj.status);
  
  let elReview = parseTextValue(mappedObj.elReview);
  if (elReview.toLowerCase() === 'yes' || elReview === 'Y' || elReview === '예' || elReview === '필요') {
    elReview = 'Yes';
  } else if (elReview.toLowerCase() === 'no' || elReview === 'N' || elReview === '아니오' || elReview === '불필요') {
    elReview = 'No';
  }

  const securityLevel = parseTextValue(mappedObj.securityLevel);
  const daysTaken = parseNumericValue(mappedObj.daysTaken);
  const revisionCount = parseNumericValue(mappedObj.revisionCount);

  // Today normalized to midnight for accurate day comparison
  const todayMidnight = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

  let isOverdue = false;
  let remainingDays: number | null = null;

  if (replyDeadlineObj) {
    const deadlineMidnight = new Date(replyDeadlineObj.getFullYear(), replyDeadlineObj.getMonth(), replyDeadlineObj.getDate());
    const diffTime = deadlineMidnight.getTime() - todayMidnight.getTime();
    remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (deadlineMidnight < todayMidnight && status !== '완료') {
      isOverdue = true;
    }
  }

  const receiptYear = receiptDateObj ? receiptDateObj.getFullYear() : null;
  const receiptMonth = receiptDateObj
    ? `${receiptDateObj.getFullYear()}-${String(receiptDateObj.getMonth() + 1).padStart(2, '0')}`
    : '미입력';
  const receiptWeek = getISOWeekString(receiptDateObj);

  return {
    id,
    receiptDate,
    replyDeadline,
    customerCode,
    country,
    targetSystem,
    queryType,
    department,
    status,
    elReview,
    securityLevel,
    daysTaken,
    revisionCount,
    isOverdue,
    remainingDays,
    receiptYear,
    receiptMonth,
    receiptWeek,
    rawRowIndex: rowIndex
  };
}

export function parseExcelFile(file: File, todayDate: Date = new Date()): Promise<{ items: RFIItem[]; duplicates: DuplicateAlert | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('엑셀 파일에 시트가 존재하지 않습니다.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('업로드한 시트에 데이터가 없습니다.');
        }

        const items: RFIItem[] = [];
        const seenIds = new Set<string>();
        const duplicateIdsSet = new Set<string>();

        rawJson.forEach((row, idx) => {
          const item = processRawRowObject(row, idx, todayDate);
          if (seenIds.has(item.id)) {
            duplicateIdsSet.add(item.id);
          } else {
            seenIds.add(item.id);
          }
          items.push(item);
        });

        const duplicateArray = Array.from(duplicateIdsSet);
        const duplicatesAlert = duplicateArray.length > 0 ? {
          duplicateIds: duplicateArray,
          totalDuplicates: duplicateArray.length
        } : null;

        resolve({ items, duplicates: duplicatesAlert });
      } catch (err: any) {
        reject(err?.message || '엑셀 파싱 중 오류가 발생했습니다.');
      }
    };
    reader.onerror = () => reject('파일을 읽는 도중 오류가 발생했습니다.');
    reader.readAsArrayBuffer(file);
  });
}

export function exportRfiToExcel(items: RFIItem[], filename = 'RFI_데이터_집계.xlsx') {
  const exportData = items.map((item) => ({
    '질의ID': item.id,
    '접수일': item.receiptDate,
    '회신기한': item.replyDeadline,
    '남은일수': item.remainingDays !== null ? item.remainingDays : '미입력',
    '기한초과여부': item.isOverdue ? '초과' : '정상',
    '고객코드': item.customerCode,
    '국가': item.country,
    '대상체계': item.targetSystem,
    '질의유형': item.queryType,
    '담당부서': item.department,
    '처리상태': item.status,
    'EL검토여부': item.elReview,
    '보안등급': item.securityLevel,
    '소요일수': item.daysTaken !== null ? item.daysTaken : '',
    '수정횟수': item.revisionCount !== null ? item.revisionCount : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RFI_집계');
  XLSX.writeFile(workbook, filename);
}

export function exportRfiToCsv(items: RFIItem[], filename = 'RFI_데이터_집계.csv') {
  const exportData = items.map((item) => ({
    '질의ID': item.id,
    '접수일': item.receiptDate,
    '회신기한': item.replyDeadline,
    '남은일수': item.remainingDays !== null ? item.remainingDays : '미입력',
    '기한초과여부': item.isOverdue ? '초과' : '정상',
    '고객코드': item.customerCode,
    '국가': item.country,
    '대상체계': item.targetSystem,
    '질의유형': item.queryType,
    '담당부서': item.department,
    '처리상태': item.status,
    'EL검토여부': item.elReview,
    '보안등급': item.securityLevel,
    '소요일수': item.daysTaken !== null ? item.daysTaken : '',
    '수정횟수': item.revisionCount !== null ? item.revisionCount : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Add UTF-8 BOM for Korean excel compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
