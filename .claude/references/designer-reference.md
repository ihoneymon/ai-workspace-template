# Designer Reference

designer 에이전트의 레퍼런스 문서. Bootstrap 5 컴포넌트 API와 사용 패턴을 제공한다.

공식 문서: https://getbootstrap.com/docs/5.3/

---

## 레이아웃

### Container

```html
<div class="container">        <!-- 반응형 고정 너비 -->
<div class="container-fluid">  <!-- 항상 100% 너비 -->
<div class="container-md">     <!-- md 이상에서만 고정 너비 -->
```

### Grid

```html
<div class="row">
  <div class="col">          <!-- 동일 너비 자동 분할 -->
  <div class="col-6">        <!-- 12컬럼 중 6 -->
  <div class="col-md-4">     <!-- md 이상에서 4컬럼 -->
  <div class="col-sm-12 col-md-6 col-lg-4">  <!-- 반응형 -->

<!-- 정렬 -->
  <div class="row align-items-center">
  <div class="row justify-content-between">
  <div class="col offset-md-2">  <!-- 2컬럼 오프셋 -->
```

### Flexbox 유틸리티

```html
<div class="d-flex gap-2 align-items-center justify-content-between flex-wrap">
<div class="d-flex flex-column gap-3">
```

---

## 컴포넌트 API

### Button

```html
<!-- variant: primary, secondary, success, danger, warning, info, light, dark -->
<button class="btn btn-primary">저장</button>
<button class="btn btn-outline-secondary">취소</button>
<button class="btn btn-danger btn-sm">삭제</button>
<button class="btn btn-primary btn-lg w-100">전체 너비</button>

<!-- 아이콘 버튼 -->
<button class="btn btn-outline-primary">
  <i class="bi bi-arrow-clockwise me-1"></i> 새로고침
</button>

<!-- 로딩 상태 -->
<button class="btn btn-primary" disabled>
  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
  저장 중...
</button>

<!-- 버튼 그룹 -->
<div class="btn-group" role="group">
  <button class="btn btn-outline-secondary">이전</button>
  <button class="btn btn-outline-secondary">다음</button>
</div>
```

**Size**: `btn-sm` | (기본) | `btn-lg`
**State**: `disabled` attribute, `active` class

### Form Controls

```html
<!-- Input -->
<div class="mb-3">
  <label for="name" class="form-label">이름 <span class="text-danger">*</span></label>
  <input type="text" class="form-control" id="name" placeholder="이름 입력">
  <div class="invalid-feedback">이름을 입력해주세요.</div>
</div>

<!-- Validation state -->
<input class="form-control is-valid">   <!-- 성공 -->
<input class="form-control is-invalid"> <!-- 오류 -->

<!-- Size -->
<input class="form-control form-control-sm">
<input class="form-control form-control-lg">

<!-- Readonly / Disabled -->
<input class="form-control" readonly>
<input class="form-control" disabled>

<!-- Textarea -->
<textarea class="form-control" rows="3"></textarea>

<!-- Select -->
<select class="form-select">
  <option selected>선택하세요</option>
  <option value="1">옵션 1</option>
</select>
<select class="form-select form-select-sm">

<!-- Checkbox -->
<div class="form-check">
  <input class="form-check-input" type="checkbox" id="check1">
  <label class="form-check-label" for="check1">항목</label>
</div>

<!-- Radio -->
<div class="form-check">
  <input class="form-check-input" type="radio" name="options" id="opt1" value="1">
  <label class="form-check-label" for="opt1">옵션 1</label>
</div>

<!-- Switch -->
<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" role="switch" id="switch1">
  <label class="form-check-label" for="switch1">활성화</label>
</div>

<!-- Input Group (입력 + 버튼 조합) -->
<div class="input-group">
  <input type="text" class="form-control" placeholder="검색어">
  <button class="btn btn-primary">검색</button>
</div>

<!-- Floating Label -->
<div class="form-floating mb-3">
  <input type="email" class="form-control" id="email" placeholder="name@example.com">
  <label for="email">이메일</label>
</div>
```

### Modal

```html
<!-- 트리거 -->
<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#myModal">
  모달 열기
</button>

<!-- 모달 -->
<div class="modal fade" id="myModal" tabindex="-1" aria-labelledby="myModalLabel" aria-hidden="true">
  <div class="modal-dialog">             <!-- modal-sm | modal-lg | modal-xl | modal-fullscreen -->
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="myModalLabel">제목</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="닫기"></button>
      </div>
      <div class="modal-body">
        <!-- 내용 -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">취소</button>
        <button type="button" class="btn btn-primary">저장</button>
      </div>
    </div>
  </div>
</div>

<!-- JS API -->
<script>
const modal = new bootstrap.Modal('#myModal')
modal.show()
modal.hide()
modal.toggle()
// 이벤트
document.getElementById('myModal').addEventListener('hidden.bs.modal', () => { ... })
</script>
```

**Modal 크기**: `modal-sm`(300px) | 기본(500px) | `modal-lg`(800px) | `modal-xl`(1140px) | `modal-fullscreen`

### Alert

```html
<div class="alert alert-success" role="alert">
  저장되었습니다.
</div>

<!-- 닫기 버튼 포함 -->
<div class="alert alert-danger alert-dismissible fade show" role="alert">
  오류가 발생했습니다.
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="닫기"></button>
</div>

<!-- 아이콘 포함 -->
<div class="alert alert-warning d-flex align-items-center gap-2" role="alert">
  <i class="bi bi-exclamation-triangle-fill"></i>
  <div>주의가 필요합니다.</div>
</div>
```

**타입**: `alert-primary` | `alert-secondary` | `alert-success` | `alert-danger` | `alert-warning` | `alert-info` | `alert-light` | `alert-dark`

### Toast

```html
<!-- Toast 컨테이너 (화면 우상단 고정) -->
<div class="toast-container position-fixed top-0 end-0 p-3">
  <div id="myToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="toast-header">
      <strong class="me-auto">알림</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="닫기"></button>
    </div>
    <div class="toast-body">저장되었습니다.</div>
  </div>
</div>

<!-- JS API -->
<script>
const toast = new bootstrap.Toast('#myToast', {
  delay: 3000,      // 자동 닫힘 (ms)
  autohide: true,
})
toast.show()
</script>
```

**위치**: `top-0 end-0` | `top-0 start-50 translate-middle-x` | `bottom-0 end-0` 등 position 유틸리티 조합

### Spinner

```html
<!-- Border spinner (원형 회전) -->
<div class="spinner-border text-primary" role="status">
  <span class="visually-hidden">로딩 중...</span>
</div>

<!-- Grow spinner (점 확대) -->
<div class="spinner-grow text-success" role="status">
  <span class="visually-hidden">로딩 중...</span>
</div>

<!-- 버튼 내 인라인 -->
<button class="btn btn-primary" disabled>
  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
  처리 중...
</button>

<!-- Size -->
<div class="spinner-border spinner-border-sm">  <!-- 작은 크기 -->
```

### Navbar

```html
<nav class="navbar navbar-expand-lg bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">브랜드</a>
    <button class="navbar-toggler" type="button"
            data-bs-toggle="collapse" data-bs-target="#navContent"
            aria-controls="navContent" aria-expanded="false" aria-label="메뉴 열기">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="#">홈</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button"
             data-bs-toggle="dropdown" aria-expanded="false">메뉴</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">항목 1</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">항목 2</a></li>
          </ul>
        </li>
      </ul>
      <form class="d-flex gap-2">
        <input class="form-control" type="search" placeholder="검색">
        <button class="btn btn-outline-primary" type="submit">검색</button>
      </form>
    </div>
  </div>
</nav>
```

### Dropdown

```html
<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" type="button"
          data-bs-toggle="dropdown" aria-expanded="false">
    선택
  </button>
  <ul class="dropdown-menu">
    <li><h6 class="dropdown-header">섹션 제목</h6></li>
    <li><a class="dropdown-item" href="#">항목 1</a></li>
    <li><a class="dropdown-item active" href="#">항목 2 (선택됨)</a></li>
    <li><a class="dropdown-item disabled">항목 3 (비활성)</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item text-danger" href="#">삭제</a></li>
  </ul>
</div>
```

### Table

```html
<div class="table-responsive">
  <table class="table table-hover table-bordered align-middle">
    <thead class="table-light">
      <tr>
        <th scope="col">
          <input type="checkbox" class="form-check-input" id="selectAll">
        </th>
        <th scope="col">이름</th>
        <th scope="col">상태</th>
        <th scope="col">등록일</th>
        <th scope="col">관리</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><input type="checkbox" class="form-check-input"></td>
        <td>홍길동</td>
        <td><span class="badge bg-success">활성</span></td>
        <td>2025-01-01</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary">수정</button>
            <button class="btn btn-outline-danger">삭제</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Table 변형**: `table-striped` | `table-hover` | `table-bordered` | `table-borderless` | `table-sm`  
**행 컬러**: `table-primary` | `table-success` | `table-danger` | `table-warning` | `table-info`

### Badge

```html
<span class="badge bg-primary">새 글</span>
<span class="badge bg-success">완료</span>
<span class="badge bg-danger">오류</span>
<span class="badge bg-warning text-dark">대기</span>
<span class="badge rounded-pill bg-info">12</span>
```

### Card

```html
<div class="card shadow-sm">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h5 class="card-title mb-0">카드 제목</h5>
    <button class="btn btn-sm btn-outline-secondary">편집</button>
  </div>
  <div class="card-body">
    <p class="card-text">내용</p>
  </div>
  <div class="card-footer text-muted">
    최종 수정: 2025-01-01
  </div>
</div>
```

### Pagination

```html
<nav aria-label="페이지 네비게이션">
  <ul class="pagination justify-content-center mb-0">
    <li class="page-item disabled">
      <a class="page-link" href="#" tabindex="-1" aria-disabled="true">이전</a>
    </li>
    <li class="page-item active" aria-current="page">
      <a class="page-link" href="#">1</a>
    </li>
    <li class="page-item"><a class="page-link" href="#">2</a></li>
    <li class="page-item"><a class="page-link" href="#">3</a></li>
    <li class="page-item">
      <a class="page-link" href="#">다음</a>
    </li>
  </ul>
</nav>
```

### Accordion

```html
<div class="accordion" id="myAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button" type="button"
              data-bs-toggle="collapse" data-bs-target="#item1"
              aria-expanded="true" aria-controls="item1">
        섹션 1
      </button>
    </h2>
    <div id="item1" class="accordion-collapse collapse show" data-bs-parent="#myAccordion">
      <div class="accordion-body">내용</div>
    </div>
  </div>
</div>
```

### Tabs

```html
<ul class="nav nav-tabs" id="myTab" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="tab1-tab" data-bs-toggle="tab"
            data-bs-target="#tab1" type="button" role="tab"
            aria-controls="tab1" aria-selected="true">탭 1</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="tab2-tab" data-bs-toggle="tab"
            data-bs-target="#tab2" type="button" role="tab"
            aria-controls="tab2" aria-selected="false">탭 2</button>
  </li>
</ul>
<div class="tab-content" id="myTabContent">
  <div class="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab">
    내용 1
  </div>
  <div class="tab-pane fade" id="tab2" role="tabpanel" aria-labelledby="tab2-tab">
    내용 2
  </div>
</div>
```

### Breadcrumb

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#">홈</a></li>
    <li class="breadcrumb-item"><a href="#">카테고리</a></li>
    <li class="breadcrumb-item active" aria-current="page">현재 페이지</li>
  </ol>
</nav>
```

### Tooltip / Popover

```html
<!-- Tooltip (data-bs-toggle="tooltip" 필요, JS 초기화 필수) -->
<button class="btn btn-secondary"
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        data-bs-title="도움말 텍스트">
  도움말
</button>

<!-- JS 초기화 (전체) -->
<script>
const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]')
tooltips.forEach(el => new bootstrap.Tooltip(el))
</script>

<!-- Popover -->
<button class="btn btn-info"
        data-bs-toggle="popover"
        data-bs-title="제목"
        data-bs-content="상세 내용">
  더 보기
</button>
```

### Progress

```html
<div class="progress" role="progressbar" aria-label="진행률" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-bar" style="width: 75%">75%</div>
</div>

<!-- 색상, 줄무늬, 애니메이션 -->
<div class="progress">
  <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" style="width: 50%"></div>
</div>
```

### Offcanvas (사이드 드로어)

```html
<button class="btn btn-primary" data-bs-toggle="offcanvas" data-bs-target="#sidebar">
  메뉴 열기
</button>

<div class="offcanvas offcanvas-start" id="sidebar" tabindex="-1"
     aria-labelledby="sidebarLabel">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="sidebarLabel">메뉴</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="닫기"></button>
  </div>
  <div class="offcanvas-body">
    <!-- 네비게이션 메뉴 -->
  </div>
</div>
```

**위치**: `offcanvas-start`(왼쪽) | `offcanvas-end`(오른쪽) | `offcanvas-top` | `offcanvas-bottom`

### List Group

```html
<ul class="list-group">
  <li class="list-group-item active" aria-current="true">활성 항목</li>
  <li class="list-group-item">일반 항목</li>
  <li class="list-group-item list-group-item-success">성공</li>
  <li class="list-group-item d-flex justify-content-between align-items-center">
    항목 <span class="badge bg-primary rounded-pill">14</span>
  </li>
</ul>
```

---

## 유틸리티 클래스

### 간격 (Spacing)

```
m-{size}   → margin all
mt-{size}  → margin-top      mb-{size} → margin-bottom
ms-{size}  → margin-left     me-{size} → margin-right
mx-{size}  → margin x-axis   my-{size} → margin y-axis

p-{size}   → padding all   (동일 패턴)

{size}: 0, 1(4px), 2(8px), 3(16px), 4(24px), 5(48px), auto
반응형: mt-md-3, mb-lg-0 등
```

### 색상

```
text-primary  text-secondary  text-success  text-danger
text-warning  text-info       text-muted    text-white
bg-primary    bg-secondary    bg-light      bg-dark
bg-success    bg-danger       bg-warning    bg-info
border-primary  border-success  border-danger
```

### 디스플레이 & 플렉스

```
d-none  d-block  d-flex  d-inline  d-inline-block  d-grid
d-md-flex  d-lg-none  (반응형)

flex-row  flex-column  flex-wrap
justify-content-start  justify-content-center  justify-content-end
justify-content-between  justify-content-around
align-items-start  align-items-center  align-items-end
gap-1  gap-2  gap-3  gap-4  gap-5
```

### 텍스트

```
text-start  text-center  text-end
fw-bold  fw-semibold  fw-normal  fw-light
fs-1(2.5rem)  fs-2  fs-3  fs-4  fs-5  fs-6(1rem)
fst-italic  text-decoration-none  text-decoration-underline
text-truncate  (ellipsis + overflow hidden)
text-uppercase  text-lowercase  text-capitalize
```

### 보더 & 그림자

```
border         border-top  border-bottom  border-start  border-end
border-0       (보더 제거)
rounded        rounded-pill  rounded-circle  rounded-0
rounded-sm     rounded-lg
shadow-none    shadow-sm    shadow    shadow-lg
```

### 크기

```
w-25  w-50  w-75  w-100  w-auto
h-25  h-50  h-75  h-100
min-vh-100  vh-100  vw-100
```

### 오버플로우 & 포지션

```
overflow-auto  overflow-hidden  overflow-scroll
position-relative  position-absolute  position-fixed  position-sticky
top-0  end-0  bottom-0  start-0
translate-middle  translate-middle-x  translate-middle-y
```

---

## 사용 패턴

### 목록 페이지 표준 구조

```html
<div class="container-fluid py-4">
  <!-- 페이지 헤더 -->
  <div class="d-flex justify-content-between align-items-center mb-3">
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item"><a href="#">홈</a></li>
        <li class="breadcrumb-item active">목록</li>
      </ol>
    </nav>
    <button class="btn btn-primary btn-sm">
      <i class="bi bi-plus-lg me-1"></i> 새로 만들기
    </button>
  </div>

  <!-- 검색 폼 -->
  <div class="card mb-3">
    <div class="card-body">
      <div class="row g-2">
        <div class="col-md-3">
          <label class="form-label">상태</label>
          <select class="form-select form-select-sm">
            <option value="">전체</option>
            <option>활성</option>
            <option>비활성</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">검색어</label>
          <input type="text" class="form-control form-control-sm" placeholder="이름 검색">
        </div>
        <div class="col-md-2 d-flex align-items-end gap-1">
          <button class="btn btn-primary btn-sm">검색</button>
          <button class="btn btn-outline-secondary btn-sm">초기화</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 액션 바 -->
  <div class="d-flex justify-content-between align-items-center mb-2">
    <span class="text-muted small">총 <strong>120</strong>건</span>
    <div class="d-flex gap-1">
      <button class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-clockwise"></i> 새로고침
      </button>
      <button class="btn btn-outline-success btn-sm">
        <i class="bi bi-file-excel"></i> 엑셀
      </button>
    </div>
  </div>

  <!-- 테이블 -->
  <div class="card">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th style="width: 40px">
              <input type="checkbox" class="form-check-input">
            </th>
            <th>이름</th>
            <th>상태</th>
            <th>등록일</th>
            <th style="width: 120px">관리</th>
          </tr>
        </thead>
        <tbody>
          <!-- 데이터 행 반복 -->
        </tbody>
      </table>
    </div>
    <div class="card-footer d-flex justify-content-between align-items-center">
      <select class="form-select form-select-sm w-auto">
        <option>10개씩</option>
        <option>20개씩</option>
        <option>50개씩</option>
      </select>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item disabled"><a class="page-link" href="#">이전</a></li>
          <li class="page-item active"><a class="page-link" href="#">1</a></li>
          <li class="page-item"><a class="page-link" href="#">2</a></li>
          <li class="page-item"><a class="page-link" href="#">다음</a></li>
        </ul>
      </nav>
    </div>
  </div>
</div>
```

### 삭제 확인 패턴 (JS)

```html
<!-- 삭제 확인 모달 -->
<div class="modal fade" id="deleteModal" tabindex="-1">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <div class="modal-header border-0">
        <h5 class="modal-title text-danger">
          <i class="bi bi-exclamation-triangle me-1"></i> 삭제 확인
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body pt-0">
        선택한 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
      </div>
      <div class="modal-footer border-0">
        <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">취소</button>
        <button type="button" class="btn btn-danger btn-sm" id="confirmDelete">삭제</button>
      </div>
    </div>
  </div>
</div>

<script>
// 삭제 후 Toast 알림
async function deleteItem(id) {
  const modal = bootstrap.Modal.getInstance('#deleteModal')
  try {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    modal.hide()
    showToast('success', '삭제되었습니다.')
  } catch {
    showToast('danger', '삭제에 실패했습니다.')
  }
}

function showToast(type, message) {
  const toastEl = document.createElement('div')
  toastEl.className = `toast align-items-center text-bg-${type} border-0`
  toastEl.setAttribute('role', 'alert')
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`
  document.querySelector('.toast-container').appendChild(toastEl)
  new bootstrap.Toast(toastEl, { delay: 3000 }).show()
}
</script>
```

### 폼 수정 모달 패턴

```html
<div class="modal fade" id="editModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">항목 수정</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="editForm" novalidate>
          <div class="row g-3">
            <div class="col-md-6">
              <label for="editName" class="form-label">
                이름 <span class="text-danger">*</span>
              </label>
              <input type="text" class="form-control" id="editName" required>
              <div class="invalid-feedback">이름을 입력해주세요.</div>
            </div>
            <div class="col-md-6">
              <label for="editStatus" class="form-label">상태</label>
              <select class="form-select" id="editStatus">
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div class="col-12">
              <label for="editDesc" class="form-label">설명</label>
              <textarea class="form-control" id="editDesc" rows="3"></textarea>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">취소</button>
        <button type="submit" form="editForm" class="btn btn-primary">저장</button>
      </div>
    </div>
  </div>
</div>
```

### 레이아웃 구조 (사이드바 + 콘텐츠)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
  <!-- GNB -->
  <nav class="navbar navbar-expand-lg bg-dark navbar-dark sticky-top">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#">My App</a>
      <div class="ms-auto d-flex align-items-center gap-3">
        <span class="text-white-50 small">관리자</span>
        <a href="/logout" class="btn btn-outline-light btn-sm">로그아웃</a>
      </div>
    </div>
  </nav>

  <div class="d-flex" style="min-height: calc(100vh - 56px)">
    <!-- LNB (사이드바) -->
    <nav class="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary border-end"
         style="width: 240px">
      <ul class="nav nav-pills flex-column mb-auto gap-1">
        <li class="nav-item">
          <a href="#" class="nav-link active">
            <i class="bi bi-house me-2"></i> 대시보드
          </a>
        </li>
        <li>
          <a href="#" class="nav-link link-body-emphasis">
            <i class="bi bi-table me-2"></i> 목록 관리
          </a>
        </li>
        <li>
          <a href="#" class="nav-link link-body-emphasis">
            <i class="bi bi-gear me-2"></i> 설정
          </a>
        </li>
      </ul>
    </nav>

    <!-- 콘텐츠 영역 -->
    <main class="flex-grow-1 p-4 overflow-auto">
      <!-- 페이지 내용 -->
    </main>
  </div>

  <!-- Toast 컨테이너 -->
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999"></div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

---

## Bootstrap Icons

CDN: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css`

```html
<i class="bi bi-{name}"></i>
<!-- 크기/색상은 font-size, color CSS 또는 유틸리티 클래스로 조정 -->
<i class="bi bi-check-circle-fill text-success fs-5"></i>
```

**자주 쓰는 아이콘**
| 용도 | 클래스 |
|------|--------|
| 저장/확인 | `bi-check-lg`, `bi-check-circle-fill` |
| 삭제 | `bi-trash3`, `bi-x-circle` |
| 수정 | `bi-pencil`, `bi-pencil-square` |
| 추가 | `bi-plus-lg`, `bi-plus-circle` |
| 새로고침 | `bi-arrow-clockwise` |
| 검색 | `bi-search` |
| 다운로드 | `bi-download`, `bi-file-excel` |
| 경고 | `bi-exclamation-triangle-fill` |
| 정보 | `bi-info-circle` |
| 성공 | `bi-check-circle` |
| 설정 | `bi-gear`, `bi-sliders` |
| 사람 | `bi-person`, `bi-people` |
| 캘린더 | `bi-calendar`, `bi-calendar-range` |
| 화살표 | `bi-chevron-left`, `bi-chevron-right` |
| 메뉴 | `bi-list`, `bi-grid` |

전체 목록: https://icons.getbootstrap.com/

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| CSS 프레임워크 | Bootstrap 5.3.x |
| 아이콘 | Bootstrap Icons 1.11.x |
| JS 의존성 | 없음 (jQuery 불필요) |
| 번들러 연동 | `import 'bootstrap'` (npm 설치 시) |
| 커스텀 테마 | `_variables.scss` 재정의 또는 CSS 변수 오버라이드 |
