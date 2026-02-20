---
title: 디스크는 남았는데 No space left on device가 뜬 이유
date: 2026-02-20
section: setting
slug: linux-inode-exhaustion
thumbnail: /images/thumbnails/linux-inode-exhaustion.svg
categories:
  - Setting
tags:
  - linux
  - inode
  - troubleshooting
  - ext4
  - filesystem
---

리눅스 서버에서 파일을 복사하거나 생성하던 중 이런 에러가 발생했다.

```
scp: mkdir ... No space left on device
```

가장 먼저 디스크 용량을 확인했다.

```bash
df -h
```

```
/dev/sda2   99G   55G   40G   58% /
```

40GB나 남아 있는데 파일 생성이 실패했다. 원인은 디스크 용량이 아니라 **inode 고갈**이었다.

## inode란

리눅스에서 파일을 생성하려면 두 가지가 필요하다.

1. 실제 데이터를 저장할 블록 공간
2. 파일 메타데이터를 기록할 슬롯 (**inode**)

inode는 파일 하나당 하나씩 소비되는 번호표다. 핵심은 **파일 크기와 무관**하다는 점이다.

| 파일 크기 | inode 사용량 |
|---|---|
| 1KB | 1 |
| 1GB | 1 |

작은 파일이 수백만 개 있으면 디스크 공간이 충분해도 파일을 더 만들 수 없다.

## 증상

inode가 고갈되면 다음 현상이 발생한다.

- `No space left on device` 에러
- `mkdir`, `touch` 등 파일 생성 실패
- `scp`, `rsync` 전송 실패
- 로그 파일 생성 실패로 서비스 비정상 동작

문제는 `df -h`로는 정상으로 보인다는 점이다. 용량만 보고 원인을 찾으려 하면 한참 헤맨다.

## 확인 방법

```bash
df -i
```

```
Filesystem     Inodes   IUsed   IFree IUse%
/dev/sda2      6553600 6553600     0  100%
```

`IUse%`가 100%라면 inode가 모두 소진된 상태다.

## 왜 발생하는가

ext4는 기본적으로 대용량 파일 저장을 기준으로 설계되어 있어서 inode 개수가 제한되어 있다. 다음 환경에서 쉽게 고갈된다.

- 작은 파일이 수백만 개 존재하는 데이터셋
- 정리되지 않은 로그 누적
- 캐시 디렉토리 폭증
- 크롤링 결과 저장

용량 문제가 아니라 **파일 개수 문제**다.

## 범인 디렉토리 찾기

inode를 많이 사용하는 경로를 확인한다.

```bash
sudo du --inodes -d 2 / | sort -nr | head
```

특정 경로만 볼 수도 있다.

```bash
du --inodes -d 3 /path | sort -nr | head
```

숫자가 큰 디렉토리가 inode를 가장 많이 소비하고 있는 범인이다.

## 임시 해결

큰 파일을 삭제해도 효과가 거의 없다. inode는 파일 개수 기준이기 때문에 **작은 파일이 많은 디렉토리**를 정리해야 한다.

```bash
# 범인 디렉토리 확인 후 불필요한 파일 삭제
rm -rf /path/to/cache/*
```

## 근본 해결

데이터가 많은 경로에 inode 밀도를 높인 별도 파일시스템을 마운트하는 것이 안전하다.

```bash
# 40GB 이미지 파일 생성
fallocate -l 40G /datasets.img

# inode 밀도를 높여서 포맷
mkfs.ext4 -i 4096 /datasets.img

# 마운트
mkdir /datasets
mount -o loop /datasets.img /datasets
```

`-i 4096` 옵션은 inode 1개당 4KB 공간을 할당한다는 의미다. 기본 ext4 설정보다 inode 수가 크게 늘어나서 작은 파일을 대량으로 저장할 수 있다.

재부팅 후에도 유지하려면 `/etc/fstab`에 등록한다.

```
/datasets.img  /datasets  ext4  loop  0  0
```

## 운영 체크 습관

파일 수가 많은 환경에서는 확인 순서를 바꾸는 게 좋다.

```bash
df -i   # inode 먼저
df -h   # 용량은 그 다음
```

디스크는 용량보다 inode 때문에 먼저 죽는 경우가 많다.

## 정리

- `No space left on device`가 항상 용량 부족을 의미하지는 않는다
- inode는 파일 크기와 무관하게 파일 하나당 하나씩 소비된다
- 작은 파일 수백만 개 환경에서는 ext4 기본 설정이 부족할 수 있다
- 데이터 경로는 inode 밀도를 높인 별도 파일시스템으로 분리하자
- **`df -h` 말고 `df -i`부터 확인하자**
