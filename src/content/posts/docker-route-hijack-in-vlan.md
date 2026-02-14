---
title: 망분리 문제인 줄 알았는데 Docker가 길을 가로챘다
date: 2026-02-14
section: setting
slug: docker-route-hijack-in-vlan
categories:
  - Setting
tags:
  - network
  - docker
  - vlan
  - routing
  - ubuntu
---

사내 VLAN 환경에서 특정 서버만 접근이 안 됐다. 방화벽 정책도 정상, UFW도 정상, ARP도 정상. 한 시간 넘게 네트워크 장비 설정만 뒤졌는데 결론은 Docker였다.

## 상황

사내 네트워크는 UniFi L3 라우터로 VLAN을 분리해서 쓰고 있다.

- VLAN10: `192.168.10.0/24` — 사내 일반망
- VLAN100: `192.168.100.0/24` — 장비망

장비망에 Ubuntu 서버(`192.168.100.10`)가 한 대 있는데, 이 서버에 Docker로 몇 가지 서비스를 올려둔 상태였다.

어느 날 사내망(VLAN10) PC에서 이 서버로 SSH가 안 됐다. 핑도 안 먹었다.

근데 이상한 게, 같은 VLAN100에 있는 다른 서버(`192.168.100.100`)는 사내망에서 잘 붙었다. 문제 서버에서 외부 인터넷도 잘 나갔다. VLAN100 안에서 서버끼리 통신도 정상이었고.

딱 **VLAN10 → 이 서버**만 안 되는 상황.

## 삽질 과정

"VLAN 간 통신이 안 되면 L3 방화벽이지"라는 생각으로 UniFi 라우터 정책부터 뒤졌다. 문제 없다. UFW? `inactive`였다. iptables 직접 확인해도 DROP 규칙 없다. `rp_filter`도 봤고, ARP 테이블도 확인했다. 게이트웨이 설정도 맞았다.

여기서 꽤 오래 헤맸다. 네트워크 장비 문제가 아니면 대체 뭘까.

## ip route 한 줄이 범인

결국 서버 자체 라우팅 테이블을 찍어봤다.

```bash
ip route
```

눈에 걸린 라인이 하나 있었다.

```text
192.168.0.0/20 dev br-xxxxxxxx
```

`/20`이면 `192.168.0.0 ~ 192.168.15.255` 범위다. 사내 일반망 `192.168.10.0/24`이 이 안에 통째로 들어간다.

Docker가 `docker-compose`로 네트워크를 만들 때 자동 할당한 브리지 대역이 사내 VLAN 대역을 먹어버린 거였다.

그래서 벌어진 일은 이렇다. VLAN10 PC가 서버에 패킷을 보내면, 요청은 게이트웨이를 통해 정상적으로 도착한다. 근데 서버가 응답을 돌려줄 때 라우팅 테이블을 보니 `192.168.10.x`가 `br-xxxx` 인터페이스 쪽이다. 게이트웨이(`192.168.100.1`)로 안 보내고 Docker 브리지로 보내버린다. 당연히 응답은 허공으로 사라진다.

요청은 오는데 응답이 엉뚱한 곳으로 나가는 비대칭 라우팅. 밖에서 보면 방화벽이 막는 것처럼 보이지만 실은 서버가 답장을 잘못된 문으로 내보내고 있었던 것이다.

## 해결

먼저 확인:

```bash
docker network ls
ip route
```

의심 가는 브리지를 지워서 즉시 통신이 복구되는지 확인했다.

```bash
docker network rm <network>
```

핑이 살아났다. 범인 확정.

영구 조치로 `/etc/docker/daemon.json`에 사내망과 안 겹치는 대역을 지정했다.

```json
{
  "default-address-pools": [
    {
      "base": "172.30.0.0/16",
      "size": 24
    }
  ]
}
```

```bash
systemctl restart docker
docker network prune
docker compose down
docker compose up -d
ip route | grep docker
```

`172.30.x.x` 대역만 남은 걸 확인하고 마무리.

## 느낀 점

네트워크가 안 되면 스위치, 라우터, 방화벽부터 보게 된다. 근데 컨테이너가 돌고 있는 서버라면 호스트 라우팅 테이블부터 보는 게 맞았다.

```bash
ip route
ip addr
ip rule
```

Docker뿐 아니라 Kubernetes CNI 대역, libvirt 브리지도 같은 문제를 일으킬 수 있다. 사내망이 `192.168.x.x` 대역이면 Docker 기본 할당이랑 겹칠 확률이 꽤 높으니, 서버에 Docker 처음 올릴 때 `daemon.json`부터 잡아두는 게 편하다.

