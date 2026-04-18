# 워크스페이스 공유 컨텍스트

이 파일은 모든 에이전트가 작업 시작 시 로드하는 팀 공통 컨텍스트입니다.
팀의 기술 스택과 컨벤션을 여기에 정의하면 에이전트에게 매번 설명하지 않아도 됩니다.

---

## 팀

- **팀명**: (예: My Team)
- **주요 언어**: (예: Kotlin, TypeScript)
- **커뮤니케이션 언어**: 한국어

---

## 기술 스택

### 백엔드
- **언어/프레임워크**: (예: Kotlin + Spring Boot 3.x)
- **빌드 도구**: (예: Gradle 8.x with Kotlin DSL)
- **데이터베이스**: (예: MySQL 8.0, Redis 7.x)
- **테스트 프레임워크**: (예: JUnit 5 + Kotest)
- **주요 라이브러리**: (예: Spring Data JPA, QueryDSL, Kafka)

### 프론트엔드
- **언어/프레임워크**: (예: TypeScript + React 18)
- **빌드 도구**: (예: Vite, Bun)
- **스타일**: (예: Bootstrap 5, Tailwind CSS)
- **상태 관리**: (예: Zustand, Recoil)

### 인프라
- **배포 환경**: (예: AWS EKS, GitHub Actions)
- **모니터링**: (예: Datadog, Sentry)

---

## 코딩 컨벤션

### 공통
- 코드 및 커밋 메시지: 한국어 주석, 영어 식별자
- 줄 길이: 120자
- 메서드 호출이 2단계 이상 중첩되면 지역변수로 추출

### 백엔드 (Kotlin)
- 패키지 구조: `com.example.{도메인}.{레이어}` (예: `com.example.order.service`)
- 레이어 구조: Controller → Service/Facade → Repository → Domain
- DTO 네이밍: `{동작}{대상}Request`, `{대상}Response` (예: `CreateOrderRequest`, `OrderResponse`)
- 예외 처리: (예: `BusinessException(ErrorCode.XXX)` 패턴)
- 테스트: 단위 테스트는 `@ExtendWith(MockitoExtension::class)`, 통합 테스트는 `@SpringBootTest`

### 프론트엔드 (TypeScript)
- 컴포넌트: PascalCase, 파일명과 일치
- 커스텀 훅: `use` 접두어 (예: `useOrderList`)
- API 호출: `src/api/{도메인}.ts`에 집중

---

## 도메인 용어 (Glossary)

팀에서 자주 쓰는 용어를 정의하세요. 에이전트가 이 용어를 기준으로 코드를 작성합니다.

| 한국어 | 영어 | 설명 |
|--------|------|------|
| (예: 주문) | Order | ... |
| (예: 정산) | Settlement | ... |

---

## 금지 사항

- PR 머지 (`gh pr merge`) 직접 실행 금지
- `main`/`master` 브랜치 직접 커밋 금지
- `projects/` 하위 파일을 워크스페이스 repo에 커밋 금지

---

## 참고 문서

- 팀 위키: (URL)
- API 문서: (URL)
- 디자인 시스템: (URL)
