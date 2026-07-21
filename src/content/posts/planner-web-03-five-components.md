---
title: "기획자를 위한 웹/앱 구조 ③ 다섯 명의 등장인물 — 프론트, 백엔드, 웹서버, WAS, DB"
date: 2026-07-21
section: planning
slug: planner-web-03-five-components
thumbnail: /images/thumbnails/planner-web-03-five-components.svg
categories:
  - Planning
tags:
  - 기획
  - 웹구조
  - 아키텍처
---

서비스를 이루는 다섯 구성요소. "누구의 일감인가"를 가르는 기준이 된다.

| 구성요소 | 하는 일 | 기획자에게 의미 |
|---|---|---|
| **프론트엔드** | 사용자 눈에 보이는 모든 것. React·Vue 같은 프레임워크로 개발하고, **빌드**하면 HTML·JS·CSS 파일 뭉치가 됨 — 이 산출물이 사용자 기기(브라우저/앱)에서 실행 | 화면 기획서가 곧 프론트엔드의 일감. "UI 수정"은 대부분 여기 |
| **백엔드** | 보이지 않는 로직 전부. 로그인 검증, 주문 처리, 권한 확인, 데이터 가공 | 정책·규칙(할인 조건, 권한 등급)은 대부분 여기. "정책 변경"은 백엔드 일감 |
| **웹서버** (nginx 등) | 현관 안내데스크. 요청을 받아 정적 파일은 직접 주고, 데이터 요청은 WAS로 전달(리버스 프록시). HTTPS 자물쇠도 여기서 처리 | 기획자가 직접 마주칠 일은 적지만 "왜 https가 안 붙어요?" 같은 이슈의 담당 지점 |
| **WAS** | 백엔드 프로그램이 실제로 돌아가는 실행 환경(Web Application Server). 백엔드 코드를 태우는 엔진 | "서버 재시작할게요" = 보통 WAS 재시작. 그 몇 초간 서비스가 잠깐 끊길 수 있음 |
| **DB** | 데이터 금고. 회원·주문·게시글이 영구 저장되는 곳. 서버를 재시작해도 데이터가 남는 이유 | "그 데이터 남나요?"의 답. DB에 안 쓰는 데이터(화면 상태 등)는 새로고침하면 사라짐 |

## 전체 배포 구조

![웹/앱 서비스 기본 배포 구조](/images/planner-web/ARCH-DEPLOY.png)

웹은 화면 파일을 서버에서 받아오고, 앱은 화면을 내장한 채 API만 호출한다 — 그래서 앱은 화면 수정에도 스토어 심사가 필요하고, 웹은 배포 즉시 반영된다.

> **웹 vs 앱의 결정적 차이**: 웹 화면은 서버의 파일을 바꾸면 즉시 반영되지만, 앱 화면은 사용자가 업데이트를 받아야 바뀐다(+스토어 심사 며칠). "이 문구 내일까지 바꿔주세요"가 웹에선 가능해도 앱에선 불가능한 이유다. 그래서 자주 바뀌는 내용은 앱 안에서도 서버가 내려주는 방식(서버 드리븐)으로 설계하기도 한다.

---

**시리즈 전체 보기**: [① 요청과 응답](/planning/planner-web-01-request-response/) · [② 정적/동적 웹](/planning/planner-web-02-static-dynamic/) · [③ 다섯 명의 등장인물](/planning/planner-web-03-five-components/) · [④ 라이브러리와 프레임워크](/planning/planner-web-04-library-framework/) · [⑤ 서버의 층위와 MSA](/planning/planner-web-05-server-layers-msa/) · [⑥ 주소와 환경](/planning/planner-web-06-address-environments/) · [⑦ 상태코드와 통역표](/planning/planner-web-07-status-codes-translation/) · [⑧ UML과 용어사전](/planning/planner-web-08-uml-glossary/)
