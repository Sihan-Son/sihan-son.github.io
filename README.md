# Sihan's Blog

Astro 5 기반 정적 블로그. Tailwind CSS 스타일링, GitHub Pages 배포.

> https://sihan-son.github.io

## 기술 스택

- **Framework**: Astro 5.x (정적 사이트 생성)
- **Styling**: Tailwind CSS 3 + @tailwindcss/typography
- **Content**: Markdown (Astro Content Collections)
- **Comments**: Giscus (GitHub Discussions)
- **Analytics**: Google Analytics
- **Ads**: Google AdSense
- **Syntax Highlighting**: Shiki (GitHub Light/Dark)

## 시작하기

```bash
npm install
npm run dev       # 로컬 개발 서버 (localhost:4321)
npm run build     # 프로덕션 빌드 (dist/)
npm run preview   # 빌드된 사이트 미리보기
```

## 새 글 작성 절차

### 1. 마크다운 파일 생성

`src/content/posts/` 디렉토리에 `.md` 파일을 생성한다.

```bash
touch src/content/posts/my-new-post.md
```

### 2. Frontmatter 작성

```markdown
---
title: "글 제목"
date: 2026-02-14
section: book
slug: my-new-post
thumbnail: /images/thumbnails/my-new-post.svg
categories:
  - Book
tags:
  - tag1
  - tag2
---

본문 내용...
```

#### Frontmatter 필드

| 필드 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `title` | O | 글 제목 | `"코틀린을 다루는 기술"` |
| `date` | O | 발행일 (YYYY-MM-DD) | `2026-02-14` |
| `section` | O | 섹션 (URL 경로에 사용) | `book`, `git`, `mldl` |
| `slug` | - | URL 슬러그 (미지정 시 파일명 사용) | `my-new-post` |
| `thumbnail` | - | 썸네일 이미지 경로 | `/images/thumbnails/my-new-post.svg` |
| `categories` | - | 카테고리 배열 | `[Book, Git]` |
| `tags` | - | 태그 배열 | `[kotlin, java]` |
| `draft` | - | `true`로 설정하면 비공개 | `false` |

#### 사용 가능한 Section

| Section | 주제 |
|---------|------|
| `book` | 서적 리뷰 |
| `git` | Git/GitHub |
| `mldl` | 머신러닝/딥러닝 |
| `setting` | 환경 설정 |
| `paper` | 논문 리뷰 |
| `language` | 언어 학습 |
| `python` | Python |
| `review` | 일반 리뷰 |
| `music` | 음악 |
| `triton` | Triton Inference Server |
| `programming_common_sense` | 프로그래밍 기초 |

새 섹션을 추가할 경우, `scripts/gen-thumbnails.mjs`의 `SECTION_PALETTES`에 색상 팔레트를 등록하면 해당 섹션 전용 썸네일 색상이 적용된다.

### 3. 썸네일 생성

#### 자동 SVG 썸네일 생성 (권장)

별도 이미지가 없으면 스크립트로 SVG 썸네일을 자동 생성할 수 있다.

```bash
node scripts/gen-thumbnails.mjs
```

이 스크립트는 `thumbnail` 필드가 비어있는 포스트를 찾아서:
- `public/images/thumbnails/{slug}.svg` 파일을 생성하고
- frontmatter의 `thumbnail` 필드를 자동으로 채워준다

생성되는 SVG는 섹션별 색상 팔레트 + 글 제목 + 날짜가 포함된 디자인이다.

**옵션:**

```bash
# 기본: thumbnail이 비어있는 포스트만 생성
node scripts/gen-thumbnails.mjs

# 기존 SVG 썸네일을 사용하는 포스트만 재생성
node scripts/gen-thumbnails.mjs --refresh-managed

# 모든 포스트의 썸네일을 강제 재생성 (기존 이미지 경로도 덮어씀)
node scripts/gen-thumbnails.mjs --force-all
```

#### 직접 이미지 사용

자체 이미지가 있다면 `public/images/` 하위에 배치하고 frontmatter에 경로를 지정한다.

```markdown
thumbnail: /images/book/hanbit/my-book-cover.jpg
```

이미지 디렉토리 관례:
- 서적 표지: `/images/book/{출판사}/`
- Git 관련: `/images/git/`
- 기타: 섹션명에 맞는 디렉토리 생성

#### 썸네일이 없는 경우

`thumbnail`을 지정하지 않으면 PostCard 컴포넌트에서 섹션 기반 그라데이션 배경이 자동 적용된다.

### 4. 로컬 확인 및 배포

```bash
# 로컬에서 확인
npm run dev

# 빌드 및 배포
npm run build
# dist/ 디렉토리를 GitHub Pages에 배포
```

## URL 구조

포스트: `/{section}/{slug}/`

```
https://sihan-son.github.io/book/ai_engineering/
https://sihan-son.github.io/git/lick-git-start/
```

그 외 페이지:
- `/` — 홈 (최신 포스트, 페이지네이션)
- `/categories/` — 카테고리 목록
- `/categories/{category}/` — 카테고리별 포스트
- `/tags/` — 태그 목록
- `/tags/{tag}/` — 태그별 포스트
- `/archives/` — 연도별 아카이브
- `/rss.xml` — RSS 피드

## 프로젝트 구조

```
src/
├── content/
│   ├── posts/           # 마크다운 포스트 (107개)
│   └── config.ts        # 컬렉션 스키마 (Zod)
├── components/          # Astro 컴포넌트
│   ├── BaseHead.astro   # <head> 메타 태그
│   ├── Header.astro     # 네비게이션 + 다크모드 토글
│   ├── Footer.astro
│   ├── Sidebar.astro    # 프로필 + 소셜 링크
│   ├── PostCard.astro   # 포스트 카드 (썸네일/그라데이션)
│   ├── Pagination.astro
│   ├── AdSense.astro
│   └── Giscus.astro     # 댓글
├── layouts/
│   ├── BaseLayout.astro # 기본 레이아웃
│   └── PostLayout.astro # 포스트 레이아웃 (사이드바 + 댓글)
├── pages/               # 파일 기반 라우팅
├── data/site.yaml       # 사이트 설정 (제목, 소셜, 광고 등)
├── lib/constants.ts     # 상수 및 헬퍼
└── styles/global.css    # Tailwind + 커스텀 스타일

scripts/
├── gen-thumbnails.mjs   # SVG 썸네일 자동 생성
└── migrate.mjs          # Hugo → Astro 마이그레이션

public/
├── images/              # 정적 이미지
│   └── thumbnails/      # 자동 생성된 SVG 썸네일
├── ads.txt
└── robots.txt
```

## 새 글 작성 빠른 참조

```bash
# 1. 포스트 파일 생성 및 작성
vi src/content/posts/my-post.md

# 2. 썸네일 자동 생성 (thumbnail 필드가 비어있으면)
node scripts/gen-thumbnails.mjs

# 3. 로컬 확인
npm run dev

# 4. 빌드 및 배포
npm run build
```
