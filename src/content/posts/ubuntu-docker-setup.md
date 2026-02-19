---
title: 우분투에서 Docker 세팅하는 법
date: 2026-02-19
section: setting
slug: ubuntu-docker-setup
thumbnail: /images/thumbnails/ubuntu-docker-setup.svg
categories:
  - Setting
tags:
  - docker
  - ubuntu
  - linux
  - container
  - nvidia
  - gpu
---

우분투 서버에 Docker를 처음 올릴 때 매번 검색하게 되는 과정을 정리했다. `apt`로 설치하면 버전이 낮으니 공식 리포지토리를 추가해서 설치하는 방법을 기준으로 한다.

## 기존 패키지 제거

우분투에 기본으로 깔려 있는 비공식 Docker 패키지가 있을 수 있다. 충돌 방지를 위해 먼저 제거한다.

```bash
sudo apt remove docker docker-engine docker.io containerd runc
```

없으면 없는 대로 넘어가니 그냥 실행하면 된다.

## 공식 리포지토리 등록

필요한 패키지 설치 후, Docker 공식 GPG 키와 리포지토리를 추가한다.

```bash
sudo apt update
sudo apt install ca-certificates curl
```

GPG 키 등록:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

리포지토리 추가:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

## Docker 설치

```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

`docker-compose-plugin`까지 같이 설치하면 `docker compose` 명령을 바로 쓸 수 있다. 예전처럼 `docker-compose`를 따로 설치할 필요 없다.

## 설치 확인

```bash
sudo docker run hello-world
```

`Hello from Docker!` 메시지가 나오면 정상이다.

## sudo 없이 쓰기

매번 `sudo`를 붙이기 귀찮으니 현재 유저를 `docker` 그룹에 추가한다.

```bash
sudo usermod -aG docker $USER
```

그룹 변경을 적용하려면 로그아웃 후 다시 로그인하거나, 아래 명령으로 즉시 반영할 수 있다.

```bash
newgrp docker
```

이후 `sudo` 없이 확인:

```bash
docker ps
```

## 부팅 시 자동 시작

우분투 22.04 이상이면 설치 시 자동 등록되지만, 혹시 안 되어 있으면:

```bash
sudo systemctl enable docker
sudo systemctl enable containerd
```

## daemon.json 기본 설정

Docker를 처음 올릴 때 몇 가지 잡아두면 나중에 편한 설정들이 있다.

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-address-pools": [
    {
      "base": "172.30.0.0/16",
      "size": 24
    }
  ]
}
EOF
sudo systemctl restart docker
```

**log-driver**: 컨테이너 로그가 디스크를 먹는 걸 방지한다. 기본값은 제한 없이 쌓이기 때문에 운영 서버에서 디스크 풀 나는 원인 1순위다.

**default-address-pools**: Docker가 브리지 네트워크를 만들 때 사용하는 IP 대역을 지정한다. 기본값이 `172.17.0.0/16`부터 시작하는데, 사내망이나 VPN 대역과 겹치면 라우팅이 꼬인다. 사내 네트워크 대역과 안 겹치는 범위로 미리 잡아두는 게 좋다.

## Docker Compose 확인

별도 설치 없이 플러그인으로 바로 쓸 수 있다.

```bash
docker compose version
```

기존에 `docker-compose`(하이픈 버전)를 쓰던 프로젝트가 있다면 명령어만 `docker compose`(스페이스)로 바꾸면 된다. yml 파일은 그대로 호환된다.

## NVIDIA Container Toolkit 설치

GPU 서버에서 Docker 컨테이너 안에서 CUDA를 쓰려면 NVIDIA Container Toolkit이 필요하다. 호스트에 NVIDIA 드라이버가 이미 설치되어 있어야 한다.

드라이버 확인:

```bash
nvidia-smi
```

출력이 나오면 드라이버는 OK. 안 나오면 드라이버부터 설치해야 한다.

```bash
sudo apt install -y nvidia-driver-560
sudo reboot
```

드라이버 버전은 GPU와 필요한 CUDA 버전에 맞춰서 선택하면 된다.

NVIDIA Container Toolkit 리포지토리 등록:

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

설치:

```bash
sudo apt update
sudo apt install -y nvidia-container-toolkit
```

Docker 런타임 등록:

```bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

이 명령을 실행하면 `/etc/docker/daemon.json`에 nvidia 런타임이 자동으로 추가된다.

GPU 컨테이너 테스트:

```bash
docker run --rm --gpus all nvidia/cuda:12.6.3-base-ubuntu24.04 nvidia-smi
```

호스트에서 보던 것과 같은 `nvidia-smi` 출력이 나오면 성공이다.

### docker compose에서 GPU 사용

`compose.yml`에서 GPU를 할당하려면:

```yaml
services:
  train:
    image: pytorch/pytorch:2.6.0-cuda12.6-cudnn9-runtime
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

특정 GPU만 쓰고 싶으면 `count: all` 대신 `device_ids: ["0", "1"]`로 지정할 수 있다.

## 정리

전체 과정을 한 스크립트로 정리하면:

```bash
# 기존 패키지 제거
sudo apt remove -y docker docker-engine docker.io containerd runc

# 리포지토리 설정
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 설치
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 유저 권한
sudo usermod -aG docker $USER

# daemon.json
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<'CONF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-address-pools": [
    {
      "base": "172.30.0.0/16",
      "size": 24
    }
  ]
}
CONF
sudo systemctl restart docker

# NVIDIA Container Toolkit (GPU 서버만)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 확인
docker --version
docker compose version
docker run --rm --gpus all nvidia/cuda:12.6.3-base-ubuntu24.04 nvidia-smi
```

GPU가 없는 서버면 NVIDIA 부분은 빼고 돌리면 된다.
