# Atlassian MCP 설정

mcp__atlassian__ 도구 호출 시 cloudId를 아래 값으로 설정하라.
`getAccessibleAtlassianResources`로 매번 조회하지 말고 이 값을 바로 사용하라.

- **cloudId**: `YOUR_CLOUD_ID`  (예: `1e7afa22-5ee0-44bb-83bf-4a1294077ff7`)
- **site**: `YOUR_SITE.atlassian.net`

> 설정 방법: Atlassian 조직 관리자에게 cloudId를 확인하거나,
> `getAccessibleAtlassianResources` 툴 한 번 호출 후 이 파일에 고정하세요.

## Jira 이슈 생성 시 issueType ID 직접 지정

`createJiraIssue` 호출 시 `issueTypeName`만으로는 커스텀 이슈 유형 매칭이 실패한다.
반드시 `additional_fields`에 이슈 타입 ID를 함께 전달하라:

```
additional_fields: {"issuetype": {"id": "<ID>"}}
```

프로젝트 이슈 유형 ID는 Jira 프로젝트 설정에서 확인하거나, 아래에 기입하세요:

| 이슈 유형 | ID |
|-----------|------|
| 에픽      |      |
| 스토리    |      |
| 작업      |      |
| 하위 작업 |      |
| 버그      |      |
