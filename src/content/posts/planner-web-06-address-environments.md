---
title: "기획자를 위한 웹/앱 구조 ⑥ 주소 이야기 — IP, 포트, 도메인, DNS와 환경 분리"
date: 2026-07-21
section: planning
slug: planner-web-06-address-environments
thumbnail: /images/thumbnails/planner-web-06-address-environments.svg
categories:
  - Planning
tags:
  - 기획
  - dns
  - 배포환경
---

서버도 집처럼 주소가 있다. 세 단어만 잡으면 된다.

- **IP** — 컴퓨터의 실제 주소. \`203.0.113.10\` 같은 숫자. 건물 주소에 해당.
- **포트(port)** — 그 컴퓨터 안의 호수. 한 서버에서 여러 프로그램이 각자 다른 포트로 손님을 받는다. \`203.0.113.10:8080\` = "그 건물 8080호". 웹의 기본 호수는 정해져 있어서(443=HTTPS, 80=HTTP) 평소엔 생략된다.
- **도메인** — 사람이 외우는 이름(\`www.example.com\`). **DNS**라는 인터넷 전화번호부가 이름을 IP로 바꿔준다. "도메인 연결해주세요" = DNS에 이름→IP 등록을 해달라는 뜻.

![도메인 입력부터 접속까지](/images/planner-web/SEQ-DNS.png)

> **현장에서**: "IP로는 접속되는데 도메인으론 안 돼요" = DNS 문제. "도메인은 되는데 특정 기능만 안 돼요" = 서버 안쪽 문제. "사내망에선 되는데 밖에선 안 돼요" = 방화벽이 그 포트를 막고 있을 가능성. — 이 세 문장만 구분해도 이슈 전달이 훨씬 정확해진다.

## 환경 분리 — dev, 스테이징, 운영

같은 서비스가 보통 **세 벌** 존재한다. 개발자가 "dev에 올렸어요"라고 하면 실사용자에겐 아직 아무 변화가 없다는 뜻이다.

![환경 3종](/images/planner-web/ENV.png)

**기획자의 체크 포인트**

- 검수 요청을 받으면 **어느 환경 주소인지** 먼저 확인 (dev/stage/www)
- 운영 배포 전 최종 확인은 **스테이징**에서 — 운영과 가장 비슷한 조건
- "운영에서만 재현되는 버그"가 존재한다 — 데이터·트래픽이 달라서. 그래서 재현 환경 질문("어디서 보셨어요?")이 중요

---

**시리즈 전체 보기**: [① 요청과 응답](/planning/planner-web-01-request-response/) · [② 정적/동적 웹](/planning/planner-web-02-static-dynamic/) · [③ 다섯 명의 등장인물](/planning/planner-web-03-five-components/) · [④ 라이브러리와 프레임워크](/planning/planner-web-04-library-framework/) · [⑤ 서버의 층위와 MSA](/planning/planner-web-05-server-layers-msa/) · [⑥ 주소와 환경](/planning/planner-web-06-address-environments/) · [⑦ 상태코드와 통역표](/planning/planner-web-07-status-codes-translation/) · [⑧ UML과 용어사전](/planning/planner-web-08-uml-glossary/)
