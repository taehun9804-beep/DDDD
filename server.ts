import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Gemini API setup
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API route for AI RFI Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { totalCount, incompleteCount, avgDaysTaken, overdueCount, elRatio, topCountry, topDepartment, countryStats, deptStats, statusStats } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'GEMINI_API_KEY가 설정되지 않아 규칙 기반 분석을 수행합니다.',
        isFallback: true
      });
    }

    const prompt = `
당신은 기술질의(RFI) 운영 데이터를 분석하는 AI 보조관입니다.
아래 제공된 RFI 집계 현황 요약 데이터를 바탕으로 보고용 AI 코멘트를 작성해 주세요.

[RFI 현황 요약 데이터]
- 총 접수 건수: ${totalCount}건
- 미완료 건수: ${incompleteCount}건 (${totalCount > 0 ? ((incompleteCount/totalCount)*100).toFixed(1) : 0}%)
- 평균 소요일수: ${avgDaysTaken !== null ? avgDaysTaken.toFixed(1) : '계산불가'}일
- 기한 초과(미처리) 건수: ${overdueCount}건
- EL 검토 비율: ${elRatio}%
- 최다 접수 국가: ${topCountry || '없음'}
- 최다 접수 부서: ${topDepartment || '없음'}
- 국가별 구성: ${JSON.stringify(countryStats || {})}
- 부서별 구성: ${JSON.stringify(deptStats || {})}
- 상태별 구성: ${JSON.stringify(statusStats || {})}

[작성 수칙 - 엄격 준수]
1. 'majorChanges' (이번 기간 주요 현황 및 변화 2~3개) 항목과 'warningItems' (주의가 필요한 항목 2~3개) 항목으로 구분하십시오.
2. 오직 데이터에서 직접 확인 가능한 객관적 사실만 명확하게 서술하십시오.
3. 원인 추정, 개선 효과 예측, 주관적 의견은 절대 포함하지 마십시오.
4. 문장은 간결하고 명확한 한국어 경어체(~습니다 / ~입니다)로 작성하십시오.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: '기술질의(RFI) 운영 데이터를 사실에 기반하여 분석하는 AI 시스템입니다.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            majorChanges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '이번 기간 주요 현황 및 변화 요약 (2-3개)'
            },
            warningItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '주의가 필요한 항목 (기한 초과, 특정 국가/부서 집중 등) (2-3개)'
            },
            summaryText: {
              type: Type.STRING,
              description: '전체 대시보드 1줄 요약'
            }
          },
          required: ['majorChanges', 'warningItems', 'summaryText']
        }
      }
    });

    const responseText = response.text?.trim() || '';
    const parsed = JSON.parse(responseText);

    return res.json({
      success: true,
      analysis: parsed,
      generatedAt: new Date().toLocaleTimeString('ko-KR')
    });
  } catch (error: any) {
    console.error('Gemini API 분석 오류:', error);
    return res.status(200).json({
      success: false,
      message: error?.message || 'Gemini API 분석 중 오류가 발생했습니다.',
      isFallback: true
    });
  }
});

async function startServer() {
  // Serve Vite in dev or static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
