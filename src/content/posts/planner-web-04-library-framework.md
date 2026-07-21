---
title: "기획자를 위한 웹/앱 구조 ④ 라이브러리와 프레임워크 — 진영 지도"
date: 2026-07-21
section: planning
slug: planner-web-04-library-framework
thumbnail: /images/thumbnails/planner-web-04-library-framework.svg
categories:
  - Planning
tags:
  - 기획
  - 프레임워크
  - react
  - spring
---

"기술 스택 뭐 쓰세요?"에 나오는 이름들(React, Spring, Django...)이 전부 이 두 종류 중 하나다.

- **라이브러리** — 필요할 때 꺼내 쓰는 **부품·도구상자**. 내 코드가 주도하고, 라이브러리를 호출한다. (예: 날짜 계산, 차트 그리기, 엑셀 내보내기)
- **프레임워크** — 집의 **뼈대·틀**. 프레임워크가 전체 구조와 흐름을 정해두고, 개발자는 정해진 자리에 코드를 채워 넣는다. (예: React, Spring Boot, Django)

> **기획자 감각**: 라이브러리 추가는 가구 하나 들이는 일이지만, 프레임워크 교체는 **이사**다. "프레임워크를 바꿔야 한다"는 말이 나오면 대규모 일정 이슈라는 신호. 반대로 "그런 라이브러리 있어요, 붙이면 돼요"는 보통 빠르다. 또 팀이 쓰는 프레임워크에 따라 채용·유지보수 인력풀이 정해지므로, 스택 선택은 기술 결정이자 조직 결정이다.

## 진영별로 자주 만나는 이름들

| 진영 | 많이 쓰는 것 (최대 3) | 한 줄 소개 |
|---|---|---|
| **프론트엔드 (JS)** | React · Vue · Angular | 화면을 만드는 프레임워크 3강. 국내는 React가 다수, Vue도 흔함. React 기반의 Next.js(SSR·풀스택)도 자주 들림 |
| **백엔드 — Java** | Spring Boot · JPA(Hibernate) · JUnit | 국내 기업 백엔드의 사실상 표준 진영. "스프링 개발자"라는 말이 곧 Java 백엔드 |
| **백엔드 — Node.js** | Express · NestJS · Next.js | 프론트와 같은 언어(JS)로 서버를 만드는 진영. 스타트업·빠른 개발에 강세 |
| **백엔드 — Python** | Django · FastAPI · Flask | 데이터·AI와 붙기 좋은 진영. Django는 풀패키지, FastAPI는 가볍고 빠른 API 전용 |
| **모바일 앱** | Swift/Kotlin (네이티브) · React Native · Flutter | 네이티브 = iOS/Android 각각 전용 개발(품질↑, 인력 2배). React Native·Flutter = 한 코드로 양쪽(크로스플랫폼) |

이름을 외울 필요는 없다 — "어느 진영 이야기인지"만 알아들으면 된다.

---

**시리즈 전체 보기**: [① 요청과 응답](/planning/planner-web-01-request-response/) · [② 정적/동적 웹](/planning/planner-web-02-static-dynamic/) · [③ 다섯 명의 등장인물](/planning/planner-web-03-five-components/) · [④ 라이브러리와 프레임워크](/planning/planner-web-04-library-framework/) · [⑤ 서버의 층위와 MSA](/planning/planner-web-05-server-layers-msa/) · [⑥ 주소와 환경](/planning/planner-web-06-address-environments/) · [⑦ 상태코드와 통역표](/planning/planner-web-07-status-codes-translation/) · [⑧ UML과 용어사전](/planning/planner-web-08-uml-glossary/)
