---
name: deploy
model: sonnet
argument-hint: "<project> <env> [source-branch] [--service <ext|int|batch>] [--strategy <recreate|rebase>]"
description: "프로젝트 배포 자동화. 소스 브랜치를 배포 브랜치(dev/qa/release)에 push하여 GitHub Actions CI/CD를 트리거한다. '/deploy', '배포해', 'dev 배포', 'qa 올려', 'release 이미지 만들어', 'ECR 빌드' 등 배포 관련 요청 시 반드시 이 스킬을 사용."
allowed-tools:
  - "Bash(git -C *)"
  - "Bash(git branch *)"
  - "Bash(git push *)"
  - "Bash(git log *)"
  - "Bash(git status *)"
  - "Bash(git rev-parse *)"
  - "Bash(git fetch *)"
  - "Bash(git rebase *)"
  - "Bash(git checkout *)"
  - "Bash(git merge-base *)"
  - "Bash(git cherry *)"
  - "Bash(gh *)"
  - "Bash(GH_HOST=* gh *)"
  - "Bash((cd *)"
  - "Bash(date *)"
  - Read
  - Glob
  - AskUserQuestion
  - Write
  - "Bash(mkdir *)"
---

# Deploy 스킬

소스 브랜치의 코드를 배포 브랜치에 push하여 GitHub Actions 파이프라인을 트리거한다.
프로덕션 배포는 범위에 포함하지 않는다 — release 이미지 생성까지만 지원한다.

## 설정

배포 설정은 `references/deploy-config.yaml`에 정의되어 있다. 스킬 실행 시 이 파일을 Read하여 프로젝트별 브랜치 매핑을 참조한다.

## 인자

```
/deploy <project> <env> [source-branch] [--service <service>] [--strategy <recreate|rebase>]
```

| 인자 | 필수 | 설명 |
|------|------|------|
| `project` | O | 프로젝트 식별자. config의 key 또는 aliases 매칭 |
| `env` | O | 배포 환경: `dev`, `qa`, `release` |
| `source-branch` | △ | 배포할 소스 브랜치. 미지정 시 대화형으로 확인 |
| `--service` | X | 특정 서비스만 배포 (my-api: `ext`, `int`, `batch`) |
| `--strategy` | X | 브랜치 전략: `recreate` 또는 `rebase`. 미지정 시 대화형으로 확인 |

인자가 부족하면 대화형으로 하나씩 확인한다. 예를 들어 `/deploy`만 입력하면 프로젝트부터 순서대로 물어본다.

## 실행 흐름

### 1. 설정 로드 & 인자 파싱

1. `references/deploy-config.yaml`을 Read한다.
2. 인자에서 project, env, source-branch, --service, --strategy를 파싱한다.
3. project를 config의 key 또는 aliases로 매칭한다. 매칭 실패 시 등록된 프로젝트 목록을 보여주고 선택을 요청한다.
4. env가 `dev`, `qa`, `release` 중 하나인지 확인한다.

### 2. 소스 브랜치 결정

source-branch가 미지정이면:
1. 프로젝트의 `repo_path` 경로에서 현재 브랜치를 확인: `git -C {repo_path} branch --show-current`
2. 결과를 사용자에게 제시하고 확인을 받는다.

source-branch가 지정되면:
1. 해당 브랜치가 로컬에 존재하는지 확인: `git -C {repo_path} rev-parse --verify {source-branch}`
2. 없으면 원격 확인: `git -C {repo_path} rev-parse --verify origin/{source-branch}`
3. 둘 다 없으면 에러.

**소스 브랜치 경고** (미지정/지정 공통):

소스 브랜치가 아래 패턴에 해당하면 AskUserQuestion으로 의도를 확인한다:
- `main` 또는 `master` — 프로덕션 기준 브랜치를 배포 소스로 사용하는 것은 드문 케이스. "main 브랜치를 소스로 사용합니다. 의도한 것이 맞나요?"
- `develop`, `qa/*`, `release/*`, `batch/*` 등 배포 브랜치 — 배포 브랜치를 다른 배포 브랜치에 push하면 혼동이 생김. "소스가 배포 브랜치입니다. 의도한 것이 맞나요?"

사용자가 확인하면 그대로 진행한다.

### 3. 서비스 & 타겟 브랜치 결정

프로젝트에 `services`가 정의된 경우 (예: my-api):

- `--service`가 지정되면 해당 서비스의 브랜치를 사용한다.
- `--service`가 없으면 AskUserQuestion으로 선택:
  ```
  배포 대상 서비스를 선택하세요:
  1. 전체 (ext + int) → develop         [기본]
  2. ext만 → ext/develop
  3. int만 → int/develop
  4. batch → batch/develop
  ```
  - `default: true`인 그룹이 기본 선택지이다.
  - batch는 항상 별도 선택지로 표시한다 (그룹에 포함되지 않음).

프로젝트에 `services`가 없는 경우 (예: my-web):
- 서비스 선택 단계를 건너뛴다.
- 환경의 `branch` 값을 타겟 브랜치로 사용한다.

**타겟 브랜치 결정**:

config의 환경 설정에서 브랜치 패턴을 읽고, 플레이스홀더를 치환한다:
- `{prefix}`: 선택된 서비스의 prefix
- `{name}`: qa 환경에서 사용자가 입력하는 이름 (보통 Jira 이슈 키)
- `{version}`: release 환경에서 사용자가 입력하는 버전

**qa 환경** — `{name}` 결정:
1. 원격 브랜치에서 기존 qa 브랜치를 조회: `git -C {repo_path} branch -r | grep 'origin/qa/'`
2. 목록을 사용자에게 보여주고 선택하거나 직접 입력하도록 한다.
3. 선택된 값으로 `{name}`을 치환한다.

**release 환경** — `{version}` 결정:
1. 오늘 날짜를 CalVer 형태로 제안: `date +%Y.%m.%d` (예: 2026.04.01)
2. 원격 브랜치에서 기존 release 브랜치를 조회하여 참고로 보여준다.
3. 사용자가 제안을 수락하거나 직접 입력한다.

### 4. 안전 점검

타겟 브랜치가 원격에 존재하는지 확인:
```bash
git -C {repo_path} fetch origin {target-branch} 2>/dev/null
```

**타겟 브랜치가 존재하면** — 미머지 커밋 경고:

소스 브랜치에 포함되지 않은 타겟 브랜치의 커밋이 있는지 확인한다:
```bash
git -C {repo_path} log origin/{target-branch} --not {source-branch} --oneline
```

출력이 있으면 (= 소스에 없는 커밋이 타겟에 존재) 경고를 표시한다:

```
⚠ 타겟 브랜치 'develop'에 소스에 없는 커밋이 있습니다:
  abc1234 [PROJ-2700] 다른 사람의 변경
  def5678 [PROJ-2701] 또 다른 변경

recreate를 선택하면 이 커밋들이 사라집니다.
rebase를 선택하면 소스 브랜치 위에 이 커밋들을 유지합니다.
```

**타겟 브랜치가 존재하지 않으면** — 경고 없이 진행 (새 브랜치 생성).

**CHANGELOG 수집:**

push 후에는 타겟이 소스와 동일해져 비교할 수 없으므로, 배포될 변경사항을 이 시점에 수집한다.

타겟 브랜치가 존재할 때:
```bash
git -C {repo_path} log origin/{target-branch}..{source-branch} --oneline
```

타겟 브랜치가 존재하지 않을 때:
```bash
MERGE_BASE=$(git -C {repo_path} merge-base origin/main {source-branch})
git -C {repo_path} log ${MERGE_BASE}..{source-branch} --oneline
```

batch QA 배포(단계 7-1)의 경우, Step 1의 타겟인 `batch/develop` 기준으로 수집한다.

이 결과를 보관하고 단계 9에서 파일로 작성한다.

### 5. 전략 선택

`--strategy`가 미지정이면 AskUserQuestion으로 확인한다:

```
브랜치 전략을 선택하세요:
1. recreate — 타겟 브랜치를 삭제 후 소스 기준으로 재생성 (타겟의 기존 커밋이 사라짐)
2. rebase — 타겟 브랜치를 소스 기준으로 rebase 후 force push (타겟의 기존 커밋 유지)
```

타겟 브랜치가 원격에 존재하지 않으면 전략 선택을 건너뛴다 — 새 브랜치 생성이므로 recreate와 동일하게 동작한다.

### 6. 실행 계획 확인

실행 전에 계획을 사용자에게 보여주고 최종 확인을 받는다:

```
실행 계획:
  프로젝트: my-api
  환경: dev
  서비스: 전체 (ext + int)
  소스: feature/username/PROJ-2850
  타겟: develop
  전략: recreate

실행할 명령:
  git push origin --delete develop
  git push origin feature/username/PROJ-2850:refs/heads/develop

진행할까요?
```

### 7. 실행

**recreate 전략**:
```bash
# 1. 원격 타겟 브랜치 삭제 (존재할 때만)
git -C {repo_path} push origin --delete {target-branch}

# 2. 소스를 타겟으로 push
git -C {repo_path} push origin {source-branch}:refs/heads/{target-branch}
```

**rebase 전략**:
```bash
# 1. 원격 타겟을 로컬에 가져오기
git -C {repo_path} fetch origin {target-branch}

# 2. 타겟 브랜치를 소스 기준으로 rebase
git -C {repo_path} rebase {source-branch} origin/{target-branch}

# 3. force push (rebase 결과를 원격에 반영)
git -C {repo_path} push origin HEAD:refs/heads/{target-branch} --force-with-lease
```

rebase 중 충돌이 발생하면:
1. `git -C {repo_path} rebase --abort`로 되돌린다.
2. 사용자에게 충돌 사실을 알리고, recreate로 전환할지 물어본다.

**새 브랜치 생성** (타겟이 존재하지 않을 때):
```bash
git -C {repo_path} push origin {source-branch}:refs/heads/{target-branch}
```

### 7-1. batch QA 배포 (특수 플로우)

batch + qa 조합은 브랜치 push만으로 완료되지 않는다. 2단계로 진행한다:

**Step 1 — 이미지 빌드**: `batch/develop`에 소스를 push한다 (dev 배포와 동일).
```bash
git -C {repo_path} push origin {source-branch}:refs/heads/batch/develop
```
이 push가 `delivery-my-batch-dev.yml`을 트리거하여 ECR 이미지를 생성한다.

**Step 2 — 이미지 태그 확인 & 배포 트리거**:
1. Step 1의 워크플로우 완료를 대기한다 (`gh run watch`).
2. 완료 후 Slack 알림 또는 워크플로우 로그에서 이미지 태그(예: `batch-dev-123`)를 확인한다:
   ```bash
   (cd {repo_path} && GH_HOST={host} gh run list --workflow delivery-my-batch-dev.yml --limit 1 --json databaseId,status,conclusion)
   ```
3. 사용자에게 배치 작업명을 확인한다:
   ```
   배포할 배치 작업을 입력하세요 (예: my-batch-job):
   ```
   입력값에 `-qa` 접미사를 붙여 QA 배치명을 생성한다.
4. workflow dispatch로 배포를 트리거한다:
   ```bash
   (cd {repo_path} && GH_HOST={host} gh workflow run batch-deploy.yml \
     -f env=dev \
     -f batch_job_name={batch_name}-qa \
     -f version={image_tag})
   ```

batch QA 배포 시 실행 계획 예시:
```
실행 계획 (batch QA — 2단계):
  Step 1: batch/develop에 push → 이미지 빌드
  Step 2: batch-deploy.yml 트리거
    - env: dev
    - batch_job_name: my-batch-job-qa
    - version: (빌드 완료 후 확인)

진행할까요?
```

### 8. 배포 상태 확인

push 성공 후 트리거된 워크플로우를 확인한다:

```bash
# GH_HOST 감지
GH_HOST=$(git -C {repo_path} remote get-url origin | sed -E 's|.*://([^/]+)/.*|\1|; s|.*@([^:]+):.*|\1|')

# 최근 워크플로우 실행 확인 (push 후 10초 대기하여 트리거 시간 확보)
sleep 3
(cd {repo_path} && GH_HOST={host} gh run list --branch {target-branch} --limit 5 --json name,status,conclusion,url,createdAt)
```

결과를 사용자에게 표시한다:

```
GitHub Actions 상태:
  deploy-my-api-ext-dev (#1234) — in_progress
    https://github.com/org/my-api/actions/runs/1234
  deploy-my-api-int-dev (#1235) — in_progress
    https://github.com/org/my-api/actions/runs/1235
```

그 다음 AskUserQuestion으로 모니터링 여부를 확인한다:

```
완료까지 백그라운드에서 모니터링할까요?
1. 예 — 완료 시 알림
2. 아니요 — 여기서 종료
```

"예"를 선택하면 각 실행 중인 워크플로우에 대해 `gh run watch`를 백그라운드로 실행한다:
```bash
(cd {repo_path} && GH_HOST={host} gh run watch {run-id} --exit-status) 2>&1
```
완료 시 결과(success/failure)를 사용자에게 알린다.

### 9. CHANGELOG 작성

단계 4에서 수집한 커밋 목록을 파일로 작성한다.

**커밋 메시지 파싱:**

이 프로젝트는 squash merge를 사용하므로 커밋 메시지 = PR 제목이다. 각 커밋에서:
1. 커밋 해시 제거
2. PR 번호 (`(#123)`) 제거
3. 이슈 키 (`[PROJ-2850]`)를 앞에서 추출하여 괄호로 뒤에 배치
4. 이슈 키가 없는 커밋은 "기타"로 분류

변환 예시:
- `a1b2c3d [PROJ-2850] 기능 A 개발 (#142)` → `기능 A 개발 (PROJ-2850)`
- `d4e5f6g 설정 파일 업데이트 (#138)` → `설정 파일 업데이트`

**파일 작성:**

경로: `{repo_path}/.changelog/{env}-{YYYYMMDD-HHmmss}.md`

`.changelog/` 디렉토리가 없으면 생성한다. 프로젝트의 `.gitignore`에 `.changelog/`가 없으면 추가한다.

```
# My API 서버 → dev 배포

반영된 내용:
- 기능 A 개발 (PROJ-2850)
- 기능 B 개발 (PROJ-2697)

기타:
- 설정 파일 업데이트
```

- 헤더의 프로젝트명은 config의 `display_name`을 사용한다
- 서비스가 있는 프로젝트는 헤더에 서비스명 포함: `My API 서버 (ext+int) → dev 배포`
- "기타" 섹션은 이슈 키 없는 커밋이 있을 때만 표시
- 커밋이 0개면 "변경사항 없음" 표시

파일 작성 후 경로와 내용을 사용자에게 표시한다.

## 에러 처리

| 상황 | 대응 |
|------|------|
| 프로젝트 경로가 존재하지 않음 | "프로젝트 경로 {path}가 존재하지 않습니다. `/sync-projects`로 clone하세요." |
| 소스 브랜치가 존재하지 않음 | "브랜치 '{branch}'가 로컬/원격 모두 존재하지 않습니다." |
| push 실패 (권한) | 에러 메시지 표시 + gh auth status 확인 안내 |
| push 실패 (기타) | 에러 메시지 표시. 상태 변경 없음 (안전) |
| rebase 충돌 | rebase --abort 후 recreate 전환 제안 |
| gh CLI 미설치 | 배포는 완료. "gh가 없어 상태 확인을 건너뜁니다." 안내 |
| batch QA Step 1 실패 | 이미지 빌드 실패 안내. Step 2로 넘어가지 않음 |
| batch QA Step 2 dispatch 실패 | workflow dispatch 에러 표시. 이미지는 이미 빌드됨을 안내 |

## 예시

```
User: /deploy be dev feature/username/PROJ-2850

Claude:
  설정 로드 완료.
  프로젝트: my-api
  환경: dev
  소스: feature/username/PROJ-2850

  배포 대상 서비스를 선택하세요:
  1. 전체 (ext + int) → develop         [기본]
  2. ext만 → ext/develop
  3. int만 → int/develop
  4. batch → batch/develop

User: 1

Claude:
  ⚠ 타겟 브랜치 'develop'에 소스에 없는 커밋이 있습니다:
    abc1234 [PROJ-2700] 다른 사람의 변경

  브랜치 전략을 선택하세요:
  1. recreate — develop을 삭제 후 소스 기준으로 재생성
  2. rebase — 소스 기준으로 rebase 후 push

User: 1

Claude:
  실행 계획:
    소스: feature/username/PROJ-2850
    타겟: develop
    전략: recreate (기존 1개 커밋 소실)

  진행할까요?

User: ㅇㅇ

Claude:
  ✓ origin/develop 삭제 완료
  ✓ feature/username/PROJ-2850 → develop push 완료

  GitHub Actions 상태:
    deploy-my-api-ext-dev (#1234) — in_progress
    deploy-my-api-int-dev (#1235) — in_progress

  완료까지 백그라운드에서 모니터링할까요?
```

```
User: /deploy admin-web qa

Claude:
  프로젝트: my-web
  환경: qa
  소스 브랜치를 지정해주세요. 현재 브랜치: feature/username/PROJ-2850

User: 현재 브랜치로

Claude:
  기존 qa 브랜치 목록:
    1. qa/PROJ-2697
    2. qa/LQAE-3180
    3. 직접 입력

  어떤 qa 브랜치에 push할까요?

User: 1

Claude:
  타겟 브랜치 'qa/PROJ-2697'에 소스에 없는 커밋이 없습니다.

  실행 계획:
    소스: feature/username/PROJ-2850
    타겟: qa/PROJ-2697
    전략: recreate (타겟에 기존 커밋 없음)

  진행할까요?
```

```
User: /deploy be qa --service batch

Claude:
  프로젝트: my-api
  환경: qa
  서비스: batch (2단계 배포)
  소스 브랜치를 지정해주세요. 현재 브랜치: feature/username/PROJ-2850

User: 현재 브랜치로

Claude:
  실행 계획 (batch QA — 2단계):
    Step 1: batch/develop에 push → 이미지 빌드
      소스: feature/username/PROJ-2850
      타겟: batch/develop
      전략: recreate
    Step 2: batch-deploy.yml 트리거
      - env: dev
      - batch_job_name: (빌드 후 입력)
      - version: (빌드 완료 후 확인)

  진행할까요?

User: ㅇㅇ

Claude:
  Step 1 완료: batch/develop push 성공
  이미지 빌드 중... (gh run watch)
  ✓ 이미지 빌드 완료: batch-dev-045

  배포할 배치 작업명을 입력하세요 (예: my-batch-job):

User: my-batch-job

Claude:
  Step 2 실행:
    gh workflow run batch-deploy.yml
      -f env=dev
      -f batch_job_name=my-batch-job-qa
      -f version=batch-dev-045

  ✓ workflow dispatch 완료
```

## 금지 사항

- 프로덕션 환경 배포 (`deploy-*-prod.yml` 트리거) 실행 금지
- `--force` push 사용 금지 (`--force-with-lease`만 허용, rebase 전략에서만)
- 사용자 확인 없이 브랜치 삭제 금지
- deploy-config.yaml에 없는 프로젝트/환경 조합 실행 금지
