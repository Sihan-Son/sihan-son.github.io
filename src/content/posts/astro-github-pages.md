---
title: Astro로 GitHub Pages 블로그 배포하기
date: 2026-02-15
section: setting
slug: astro-github-pages
thumbnail: /images/thumbnails/astro-github-pages.svg
categories:
  - Setting
tags:
  - blog
  - github
  - astro
  - hugo
  - web
---

이 블로그가 Astro + GitHub Pages 조합이다. Jekyll → Hugo → Astro 순서로 갈아탔는데, 매번 이유가 있었다. 지금은 빌드 속도, 컴포넌트 구조, 마크다운 처리 전부 만족스럽다. 처음 세팅할 때 삽질했던 부분 정리해둔다.

## 블로그 엔진 변천사

**Jekyll** 시절에는 Ruby 환경 세팅이 고역이었다. 윈도우에서 Bundler 충돌 나고, 의존성 버전 맞추느라 글 쓰는 시간보다 환경 잡는 시간이 더 길었다.

그래서 **Hugo**로 넘어갔다. Go 바이너리 하나로 돌아가니 환경 문제는 깔끔하게 해결됐고, 빌드 속도도 빨랐다. 한동안 잘 썼는데 점점 불만이 쌓였다. Go 템플릿 문법이 직관적이지 않고, 레이아웃 커스텀하려면 Hugo 내부 구조를 너무 깊이 알아야 했다. 컴포넌트 개념이 없어서 재사용이 번거롭고, 테마 의존도가 높아서 내가 원하는 디자인을 만들기가 까다로웠다.

결국 **Astro**로 왔다. 선택 이유는 명확하다.

- 정적 사이트 최적화. 기본적으로 JS를 클라이언트에 안 보낸다.
- `.astro` 컴포넌트가 JSX처럼 직관적이다. Hugo 템플릿과는 차원이 다르다.
- 마크다운 처리가 내장이라 플러그인 지옥이 없다.
- Tailwind, React, Vue 등 원하는 걸 골라 쓸 수 있다.
- 빌드도 100개 넘는 포스트가 2초 컷이다.

Hugo에서 마이그레이션할 때 `content/posts/` 구조가 비슷해서 frontmatter만 약간 손보면 됐다. 마크다운 본문은 거의 그대로 옮겨졌다.

## 프로젝트 생성

```bash
npm create astro@latest my-blog
cd my-blog
```

프롬프트에서 빈 프로젝트(Empty)를 선택하면 된다. TypeScript는 취향이지만 켜두는 걸 추천한다.

Tailwind를 쓸 거면 같이 세팅한다.

```bash
npx astro add tailwind
```

## 핵심 설정: astro.config.mjs

GitHub Pages 배포에서 가장 중요한 파일이다.

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://<username>.github.io',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap(),
  ],
});
```

주의할 점:

- **`site`은 필수다.** 이걸 안 넣으면 sitemap, canonical URL, OG 이미지 경로가 전부 깨진다.
- `<username>.github.io` 레포가 아니라 `<username>.github.io/<repo>` 형태라면 `base: '/<repo>/'`를 추가해야 한다.
- **`trailingSlash: 'always'`** 를 넣어야 GitHub Pages에서 404가 안 난다. GitHub Pages는 `/about`을 요청하면 `/about/index.html`을 찾는데, trailing slash 없이 빌드하면 `/about.html`로 나온다.

## 콘텐츠 컬렉션

Astro 5.x 기준으로 `src/content/`에 마크다운을 넣고 컬렉션으로 관리한다.

`src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    section: z.string(),
    slug: z.string().optional(),
    thumbnail: z.string().optional().nullable(),
    draft: z.boolean().optional().default(false),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { posts };
```

포스트는 `src/content/posts/` 안에 마크다운으로 작성한다.

```markdown
---
title: "첫 번째 글"
date: 2026-02-15
section: blog
categories:
  - Dev
tags:
  - astro
---

본문 내용
```

페이지에서 가져다 쓸 때:

```typescript
import { getCollection } from 'astro:content';

const posts = (await getCollection('posts'))
  .filter(p => !p.data.draft)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

## GitHub Actions 워크플로우

레포에 `.github/workflows/deploy.yml`을 만든다. 이게 전부다.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

삽질 포인트:

- **`permissions`이 빠지면 배포가 실패한다.** `pages: write`와 `id-token: write`가 둘 다 있어야 한다.
- `path: dist/`는 Astro 기본 빌드 출력 디렉토리다. 바꿨으면 맞춰야 한다.
- `concurrency`는 동시 배포를 막아준다. 빠르게 연속 푸시하면 배포가 꼬일 수 있으므로 넣어두는 게 좋다.

## GitHub 레포 설정

워크플로우 파일만으로는 안 된다. 레포 설정도 바꿔야 한다.

1. GitHub 레포 → Settings → Pages
2. Source를 **GitHub Actions**로 변경 (기존 "Deploy from a branch"가 아님)

이걸 안 바꾸면 워크플로우가 성공해도 사이트에 반영이 안 된다. 처음에 여기서 30분 날렸다.

## 로컬 개발

```bash
npm run dev
```

`http://localhost:4321`에서 확인할 수 있다. 핫 리로드가 빠르다.

빌드 결과물을 로컬에서 미리 보려면:

```bash
npm run build
npm run preview
```

`preview`는 빌드된 정적 파일을 서빙해주므로 배포 전 최종 확인용으로 쓰면 좋다.

## 커스텀 도메인

`<username>.github.io`가 아니라 자기 도메인을 쓰고 싶으면:

1. `public/CNAME` 파일에 도메인을 적는다.

```text
blog.example.com
```

2. DNS에서 CNAME 레코드를 `<username>.github.io`로 잡는다.

3. `astro.config.mjs`의 `site`도 바꾼다.

```javascript
site: 'https://blog.example.com',
```

`public/` 안의 파일은 빌드 시 `dist/`에 그대로 복사되므로 CNAME이 유지된다.

## 마무리

정리하면 이렇다.

1. `astro.config.mjs`에 `site` 설정
2. GitHub Actions 워크플로우 작성
3. 레포 Settings → Pages → Source를 GitHub Actions로 변경
4. 푸시하면 자동 배포

Jekyll → Hugo → Astro를 거치면서 느낀 건, 블로그 엔진은 결국 "글 쓰는 데 방해가 안 되는 것"이 최고라는 거다. Jekyll은 환경이 발목을 잡았고, Hugo는 커스텀이 발목을 잡았다. Astro는 둘 다 안 잡는다. Node.js 하나면 끝이다.
