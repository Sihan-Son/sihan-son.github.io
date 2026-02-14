---
title: "DRF 미들웨어로 횡단 관심사 분리하기 - 로깅, 추적, 예외 처리"
date: 2026-02-14
section: drf
slug: drf-middleware-cross-cutting
thumbnail: /images/thumbnails/drf-middleware-cross-cutting.svg
draft: true
categories:
  - Django REST Framework
tags:
  - drf
  - middleware
  - logging
  - request-id
  - architecture
---

모든 API 요청에 로그를 남기고, 에러를 추적하고, 요청 ID를 부여하는 건 개별 View에서 할 일이 아니다. Django 미들웨어로 **횡단 관심사(Cross-Cutting Concerns)**를 분리하면 View는 비즈니스 로직에만 집중할 수 있다.

## 미들웨어 실행 순서

```
요청(Request) 방향 →

SecurityMiddleware
    → RequestIdMiddleware        ← 요청 ID 부여
        → ExceptionMiddleware    ← 예외 포착
            → SessionMiddleware
                → AuthenticationMiddleware
                    → View 실행
                ← AuthenticationMiddleware
            ← SessionMiddleware
        ← ExceptionMiddleware
    ← RequestLoggingMiddleware   ← 요청/응답 로깅
← SecurityMiddleware

← 응답(Response) 방향
```

미들웨어는 양파 구조다. 요청은 바깥에서 안으로, 응답은 안에서 바깥으로 흐른다. 순서가 중요하다.

## 1. Request ID 미들웨어

모든 요청에 고유 ID를 부여해서 로그 추적을 가능하게 한다.

```python
import uuid


class RequestIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 클라이언트가 보낸 X-Request-Id가 있으면 사용, 없으면 생성
        request_id = request.headers.get("X-Request-Id", uuid.uuid4().hex)
        request.request_id = request_id

        response = self.get_response(request)

        # 응답 헤더에도 포함
        response["X-Request-Id"] = request_id
        return response
```

이 미들웨어는 **가장 먼저** 실행되어야 한다. 이후 모든 미들웨어와 View에서 `request.request_id`를 사용할 수 있다.

```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'apps.middleware.request_id.RequestIdMiddleware',  # 최상단
    ...
]
```

### 마이크로서비스 간 전파

다른 서비스를 호출할 때 `X-Request-Id` 헤더를 전달하면 분산 환경에서도 전체 요청 흐름을 추적할 수 있다:

```python
import requests

def call_external_service(request, url, data):
    return requests.post(
        url,
        json=data,
        headers={"X-Request-Id": request.request_id},
    )
```

## 2. 예외 로깅 미들웨어

View에서 처리되지 않은 예외를 포착하고 상세 로그를 남긴다.

```python
import logging
import traceback

logger = logging.getLogger("exception")


class ExceptionLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        logger.error(
            "Unhandled exception",
            extra={
                "request_id": getattr(request, "request_id", "unknown"),
                "method": request.method,
                "path": request.get_full_path(),
                "user": str(getattr(request, "user", "anonymous")),
                "client_ip": self._get_client_ip(request),
                "traceback": traceback.format_exc(),
            },
        )
        # None을 반환하면 Django 기본 예외 처리로 넘어감
        # DRF의 exception_handler가 처리하게 된다
        return None

    def _get_client_ip(self, request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")
```

`process_exception`은 Django가 제공하는 미들웨어 훅이다. View에서 예외가 발생하면 호출된다.

## 3. 요청/응답 로깅 미들웨어

모든 API 호출의 입출력을 기록한다.

```python
import json
import logging
import time

logger = logging.getLogger("request")

# 로그에서 마스킹할 민감 필드
SENSITIVE_FIELDS = {"password", "token", "refresh", "access", "secret", "otp"}
MAX_BODY_LENGTH = 10240  # 10KB


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.monotonic()

        # 요청 바디 캡처
        try:
            request_body = request.body.decode("utf-8")[:MAX_BODY_LENGTH]
        except Exception:
            request_body = "<binary>"

        response = self.get_response(request)

        duration_ms = (time.monotonic() - start_time) * 1000

        # 응답 바디 캡처
        try:
            if hasattr(response, "content"):
                response_body = response.content.decode("utf-8")[:MAX_BODY_LENGTH]
            else:
                response_body = "<streaming>"
        except Exception:
            response_body = "<binary>"

        log_data = {
            "request_id": getattr(request, "request_id", "unknown"),
            "method": request.method,
            "path": request.get_full_path(),
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "user": str(getattr(request, "user", "anonymous")),
            "client_ip": self._get_client_ip(request),
            "request_body": self._mask_sensitive(request_body),
            "response_body": response_body[:1024],  # 응답은 1KB만
        }

        if response.status_code >= 400:
            logger.warning("API request completed with error", extra=log_data)
        else:
            logger.info("API request completed", extra=log_data)

        return response

    def _mask_sensitive(self, body_str):
        """민감 필드를 마스킹"""
        try:
            data = json.loads(body_str)
            if isinstance(data, dict):
                return json.dumps(self._mask_dict(data))
        except (json.JSONDecodeError, TypeError):
            pass
        return body_str

    def _mask_dict(self, d):
        masked = {}
        for key, value in d.items():
            if key.lower() in SENSITIVE_FIELDS:
                masked[key] = "***"
            elif isinstance(value, dict):
                masked[key] = self._mask_dict(value)
            else:
                masked[key] = value
        return masked

    def _get_client_ip(self, request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")
```

### 로그 출력 예시

```json
{
    "request_id": "a1b2c3d4e5f6",
    "method": "POST",
    "path": "/api/v1/auth/login",
    "status": 200,
    "duration_ms": 142.35,
    "user": "anonymous",
    "client_ip": "192.168.1.100",
    "request_body": "{\"email\": \"user@example.com\", \"password\": \"***\"}",
    "response_body": "{\"success\": true, ...}"
}
```

`password` 필드가 `***`로 마스킹된 것에 주목하자.

## 미들웨어 등록 순서

```python
MIDDLEWARE = [
    # 1. 보안
    'django.middleware.security.SecurityMiddleware',

    # 2. 요청 ID (최대한 앞에)
    'apps.middleware.request_id.RequestIdMiddleware',

    # 3. 예외 로깅 (View 예외를 잡아야 하므로 View보다 앞에)
    'apps.middleware.ExceptionMiddleware.ExceptionLoggingMiddleware',

    # 4. Django 기본
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    # 5. 요청/응답 로깅 (최종 응답을 기록해야 하므로 맨 뒤)
    'apps.middleware.LoggingMiddleware.RequestLoggingMiddleware',
]
```

로깅 미들웨어가 맨 뒤에 있는 이유: 양파 구조에서 맨 뒤에 있으면 **요청은 마지막에 받고, 응답은 가장 먼저 받는다**. 즉, View 실행 후 다른 미들웨어 처리까지 완료된 최종 응답을 기록할 수 있다.

## 미들웨어 vs DRF의 관심사 경계

| 관심사 | 처리 위치 | 이유 |
|--------|-----------|------|
| 요청 ID 부여 | 미들웨어 | 모든 요청에 적용, DRF 이전에 실행 |
| 요청/응답 로깅 | 미들웨어 | DRF 외 요청(admin 등)도 로깅 |
| 예외 로깅 | 미들웨어 | 스택 트레이스 캡처 |
| 예외 → 응답 변환 | DRF Exception Handler | DRF 예외 타입별 분기 |
| 인증 | DRF Authentication | 토큰 파싱, 유저 조회 |
| 권한 | View 내부 | 리소스별 세밀한 권한 체크 |
| 입력 검증 | Serializer | 필드별 검증 로직 |

미들웨어는 **HTTP 레벨**의 횡단 관심사를, DRF는 **API 레벨**의 관심사를 처리한다. 이 경계를 지키면 각 레이어가 자기 역할에 집중할 수 있다.

## 정리

1. **Request ID**: 모든 요청에 고유 ID를 부여해 로그 추적의 기반을 만든다
2. **예외 로깅**: 미처리 예외를 잡아 상세 컨텍스트와 함께 기록한다
3. **요청/응답 로깅**: 전체 API 호출 이력을 남기되, 민감 정보는 마스킹한다
4. **순서가 중요하다**: Request ID → 예외 → Django 기본 → 로깅 순서를 지킨다

이 세 가지 미들웨어만 있으면 운영 환경에서 문제가 생겼을 때 "언제, 누가, 무슨 요청을 보냈고, 어디서 에러가 났는지"를 빠르게 파악할 수 있다.
