# SSAFY 과제

## 📌 MCP(Model Context Protocol)

---

- **개념**: LLM이 외부 **도구·데이터**에 표준 방식으로 접근하게 해 주는 **오픈 프로토콜**. 흔히 “AI용 USB-C”에 비유됩니다. 하나의 규격으로 다양한 서버(도구/데이터 소스)와 연결합니다. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/)[OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)
- **구성요소(아키텍처)**: **클라이언트–호스트–서버** 구조. JSON-RPC 기반 세션으로 클라이언트와 서버가 상호 작용하며, 보안 경계를 명확히 유지합니다. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/specification/2025-06-18/architecture?utm_source=chatgpt.com)
- **핵심 프리미티브**
    - **Tools**: 모델이 호출하는 실행 기능(API 호출, 계산 등). [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/docs/concepts/tools?utm_source=chatgpt.com)
    - **Resources**: 모델 컨텍스트로 쓰는 데이터(파일, DB 스키마 등), URI로 식별. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/docs/concepts/resources?utm_source=chatgpt.com)
    - **Prompts**: 서버가 노출하는 프롬프트 템플릿(매개변수화 가능). [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/docs/concepts/prompts?utm_source=chatgpt.com)
- **전송/배치 옵션(예)**:
    1. **Hosted MCP tools**(원격) 2) **Streamable HTTP**(로컬/원격) 3) **stdio**(로컬 프로세스) — 사용 목적에 맞게 선택. **툴 승인(HITL)**·**툴 필터링**도 제공. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)

---

## 장점

- **호환성과 재사용**: 한 번 만든 MCP 서버(파일시스템, Git, DB 등)를 여러 LLM/앱에서 재사용. 사일로화·벤더 종속 완화. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/)
- **보안·통제**: 호스트 경계 내에서 서버를 분리하고, **툴 허용/차단** 및 **사전 승인(HITL)**으로 민감 작업을 통제. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)[모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/specification/2025-06-18/architecture?utm_source=chatgpt.com)
- **표준적 기능 모델링**: tools/resources/prompts로 기능·데이터·프롬프트를 **발견(list)→호출(call)**하는 일관된 절차. [모델 컨텍스트 프로토콜+2모델 컨텍스트 프로토콜+2](https://modelcontextprotocol.io/docs/concepts/tools?utm_source=chatgpt.com)
- **배치 유연성**: 원격 SaaS, 사내 HTTP, 로컬 프로세스(stdio)까지 상황에 맞게 연결. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)

## 단점

- **학습 곡선**: 서버 구현(스키마 설계, 에러 처리, 인증)과 운영(로그/승인 플로우) 복잡도 존재. *(일반적 한계)*
- **지연/오버헤드**: 원격 MCP 서버 호출, 도구 목록 조회 등의 왕복 지연이 누적될 수 있음. 캐시/로컬화 필요. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)
- **생태계 성숙도**: 표준과 SDK가 빠르게 진화 중—버전·전송 방식(Streamable HTTP 등) 변화 추적 필요. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/specification/2025-06-18/architecture?utm_source=chatgpt.com)

---

## 사용처

- **코딩 어시스턴트/IDE**: 로컬 파일, Git, 빌드/테스트 도구에 안전하게 접근. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/)
- **RAG/업무 자동화**: 내부 문서·DB·SaaS(이슈 트래커, CRM)와 연결해 질의·집계·조치 수행. [모델 컨텍스트 프로토콜](https://modelcontextprotocol.io/)
- **에이전트 워크플로**: 여러 도구를 묶어 “찾기→분석→조치” 체인을 구성(예: 리포지토리 읽고 → 이슈 조회 → PR 생성). [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)

---

## 다른 접근과의 차이(간단 비교)

| 항목 | 전통적 함수호출/전용 API | **MCP** |
| --- | --- | --- |
| 통합 방식 | 모델·앱마다 개별 통합 | **표준 프리미티브로 재사용** |
| 배치 | 보통 HTTP/벤더별 | **Hosted/HTTP/stdio** 유연 |
| 거버넌스 | 앱별 커스텀 | **툴 승인/필터링** 내장 [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/) |

---

## 도입 체크리스트(실무)

1. **목표 능력** 식별: 읽기(리소스)·실행(툴)·템플릿(프롬프트) 중 무엇이 필요한가? [모델 컨텍스트 프로토콜+2모델 컨텍스트 프로토콜+2](https://modelcontextprotocol.io/docs/concepts/tools?utm_source=chatgpt.com)
2. **전송 선택**: 로컬이면 `stdio`, 내부망이면 **Streamable HTTP**, 공개 서비스면 **Hosted** 우선. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)
3. **보안정책**: 툴 승인 범위/필터링, 자격증명 스코프 설정. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)
4. **성능**: 도구 목록 캐시, 스트리밍 결과 사용. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)
5. **SDK**: 공식 SDK(Typescript/Python 등)로 서버/클라이언트 구현. [OpenAI GitHub](https://openai.github.io/openai-agents-js/guides/mcp/)

---

## 한 줄 결론

> MCP는 “LLM↔도구/데이터” 연결을 표준화해 재사용성과 거버넌스를 동시에 잡는 방식입니다. 코딩 보조, 내부 지식 검색, 업무 자동화 같은 시나리오에서 특히 유효합니다.
>