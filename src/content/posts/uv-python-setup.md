---
title: "uv로 파이썬 환경 세팅 — pip·venv·pyenv를 하나로"
date: 2026-07-21
section: python
slug: uv-python-setup
thumbnail: /images/thumbnails/uv-python-setup.svg
categories:
  - Python
tags:
  - python
  - uv
  - venv
  - 환경설정
---

파이썬 환경 관리 도구는 오래 파편화되어 있었다. 인터프리터 버전은 pyenv, 가상환경은 venv, 패키지는 pip, 잠금은 pip-tools나 Poetry... [uv](https://docs.astral.sh/uv/)는 이걸 하나로 합친 Rust 기반 도구다. 속도가 pip 대비 10~100배 수준이라 한 번 쓰면 돌아가기 어렵다.

## 설치

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# macOS (Homebrew)
brew install uv

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

확인:

```bash
uv --version
```

## 파이썬 인터프리터 관리 (pyenv 대체)

uv가 파이썬 자체를 받아서 관리한다. 시스템 파이썬을 건드리지 않는다.

```bash
uv python install 3.12        # 3.12 최신 설치
uv python install 3.11 3.13   # 여러 버전 동시 설치
uv python list                # 설치된/설치 가능한 버전 목록
```

## 새 프로젝트 시작

```bash
uv init my-project
cd my-project
```

`pyproject.toml`과 기본 구조가 생긴다. 패키지 추가는:

```bash
uv add requests               # 의존성 추가
uv add --dev pytest ruff      # 개발용 의존성
uv remove requests            # 제거
```

`uv add`가 하는 일: `pyproject.toml` 갱신 + `uv.lock` 잠금 + `.venv` 가상환경 자동 생성·동기화. **venv를 직접 만들거나 activate할 필요가 없다.**

## 실행

```bash
uv run python main.py         # 프로젝트 환경으로 실행
uv run pytest                 # 개발 도구도 동일하게
```

`uv run`은 실행 전에 `uv.lock` 기준으로 환경이 맞는지 확인하고, 어긋나 있으면 자동으로 맞춘 뒤 실행한다. "제 컴퓨터에선 되는데요"가 구조적으로 줄어든다.

## 기존 프로젝트 합류 (팀원 온보딩)

```bash
git clone <repo>
cd <repo>
uv sync                       # uv.lock 그대로 환경 재현 — 끝
```

`requirements.txt` 시절의 "파이썬 버전 뭐예요? venv 어떻게 만들어요?" 문답이 `uv sync` 한 줄로 끝난다.

## 일회성 도구 실행 (pipx 대체)

```bash
uvx ruff check .              # 설치 없이 도구 즉석 실행
uvx --from httpie http GET example.com
```

전역 오염 없이 격리 환경에서 도구를 돌린다.

## 기존 pip 워크플로우가 필요할 때

옮기는 중이라면 pip 호환 인터페이스도 있다.

```bash
uv venv                        # .venv 생성
uv pip install -r requirements.txt
uv pip freeze
```

기존 스크립트·CI를 그대로 두고 속도만 얻고 싶을 때 유용하다.

## 정리 — 대응표

| 기존 | uv |
|---|---|
| pyenv install 3.12 | uv python install 3.12 |
| python -m venv .venv + activate | (자동 — uv add/sync가 관리) |
| pip install requests | uv add requests |
| pip install -r requirements.txt | uv sync (또는 uv pip install -r ...) |
| pip-tools / Poetry lock | uv.lock (자동) |
| pipx run ruff | uvx ruff |

새 프로젝트라면 `uv init → uv add → uv run` 세 개만 기억하면 된다.
