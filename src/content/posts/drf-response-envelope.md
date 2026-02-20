---
title: "DRF 응답 포맷 통일하기 - Response Envelope 패턴"
date: 2026-02-14
section: drf
slug: drf-response-envelope
thumbnail: /images/thumbnails/drf-response-envelope.svg
categories:
  - Django REST Framework
tags:
  - drf
  - response
  - exception handler
  - error handling
---

DRF 기본 설정으로 API를 만들면 성공 응답은 데이터만 반환하고, 에러 응답은 제각각인 형태가 된다. 클라이언트 개발자가 모든 응답을 일관되게 처리하려면 **Response Envelope 패턴**이 필요하다.

## 문제: DRF 기본 응답의 비일관성

```json
// 성공 (200)
{"id": 1, "name": "홍길동"}

// 유효성 검증 실패 (400)
{"name": ["이 필드는 필수입니다."]}

// 인증 실패 (401)
{"detail": "자격 인증데이터(credentials)가 제공되지 않았습니다."}

// 권한 없음 (403)
{"detail": "이 작업을 수행할 권한(permission)이 없습니다."}

// 서버 에러 (500)
HTML 페이지가 반환됨...
```

클라이언트는 성공/실패 여부를 HTTP 상태 코드로 판단하고, 에러 메시지 위치를 `detail`인지 필드명인지 케이스별로 분기해야 한다.

## Response Envelope: 통일된 응답 구조

```json
{
    "success": true,
    "code": "USER_CREATED",
    "message": "사용자 생성 완료",
    "data": {
        "user_ulid": "01HXYZ...",
        "name": "홍길동"
    },
    "meta": {
        "timestamp": "2026-02-14T12:30:45+09:00",
        "request_id": "a1b2c3d4e5f6"
    }
}
```

```json
{
    "success": false,
    "code": "INVALID_REQUEST",
    "message": "입력값이 올바르지 않습니다",
    "errors": {
        "name": ["이 필드는 필수입니다."]
    },
    "meta": {
        "timestamp": "2026-02-14T12:30:45+09:00",
        "request_id": "a1b2c3d4e5f6"
    }
}
```

모든 응답이 같은 구조를 갖는다. 클라이언트는 `success` 필드 하나로 분기하면 된다.

## 구현: ok()와 fail() 헬퍼

```python
from rest_framework.response import Response
from datetime import datetime, timezone
import uuid


def _build_meta(request=None, extra=None):
    meta = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": getattr(request, "request_id", uuid.uuid4().hex) if request else uuid.uuid4().hex,
    }
    if extra:
        meta.update(extra)
    return meta


def ok(code, message="", data=None, request=None, status=200, meta=None):
    body = {
        "success": True,
        "code": code,
        "message": message,
        "meta": _build_meta(request, meta),
    }
    if data is not None:
        body["data"] = data
    return Response(body, status=status)


def fail(code, message, errors=None, request=None, status=400, meta=None):
    body = {
        "success": False,
        "code": code,
        "message": message,
        "meta": _build_meta(request, meta),
    }
    if errors is not None:
        body["errors"] = errors
    return Response(body, status=status)
```

View에서는 이렇게 쓴다:

```python
class UserListView(APIView):
    def get(self, request):
        users = list_users()
        return ok(
            code="USER_LIST",
            message="사용자 목록 조회",
            data=UserSerializer(users, many=True).data,
            request=request,
        )

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = create_user(**serializer.validated_data)
        return ok(
            code="USER_CREATED",
            message="사용자 생성 완료",
            data=UserSerializer(user).data,
            request=request,
        )
```

## 핵심: Custom Exception Handler

`serializer.is_valid(raise_exception=True)`가 던지는 `ValidationError`, 인증 실패 시 `AuthenticationFailed` 등 DRF가 자동으로 발생시키는 예외도 같은 포맷으로 감싸야 한다.

```python
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    Throttled,
)
from django.http import Http404


def exception_handler(exc, context):
    request = context.get("request")

    # 도메인 에러 (서비스 레이어에서 발생)
    if isinstance(exc, ApiError):
        return fail(
            code=exc.code,
            message=exc.message,
            errors=exc.errors,
            request=request,
            status=exc.status,
        )

    # DRF 유효성 검증 에러
    if isinstance(exc, ValidationError):
        return fail(
            code="INVALID_REQUEST",
            message="입력값이 올바르지 않습니다",
            errors=exc.detail,
            request=request,
            status=400,
        )

    # 인증 에러
    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return fail(
            code="UNAUTHORIZED",
            message=str(exc.detail),
            request=request,
            status=401,
        )

    # 권한 에러
    if isinstance(exc, PermissionDenied):
        return fail(
            code="FORBIDDEN",
            message=str(exc.detail),
            request=request,
            status=403,
        )

    # 404
    if isinstance(exc, Http404):
        return fail(
            code="NOT_FOUND",
            message="요청한 리소스를 찾을 수 없습니다",
            request=request,
            status=404,
        )

    # Rate Limit
    if isinstance(exc, Throttled):
        return fail(
            code="RATE_LIMITED",
            message=f"요청이 너무 많습니다. {exc.wait}초 후 재시도하세요",
            request=request,
            status=429,
        )

    # 기타 DRF 예외
    response = drf_exception_handler(exc, context)
    if response is not None:
        return fail(
            code="ERROR",
            message="요청 처리 중 오류가 발생했습니다",
            errors=response.data,
            request=request,
            status=response.status_code,
        )

    # 미처리 서버 에러
    import logging
    logger = logging.getLogger(__name__)
    logger.exception("Unhandled exception")

    return fail(
        code="INTERNAL_ERROR",
        message="서버 내부 오류가 발생했습니다",
        request=request,
        status=500,
    )
```

settings.py에 등록:

```python
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "apps.utils.exception_handler.exception_handler",
}
```

## 도메인 에러 클래스

서비스 레이어에서 비즈니스 규칙 위반을 표현할 때:

```python
from dataclasses import dataclass
from typing import Any, Mapping, Optional


@dataclass(frozen=True)
class ApiError(Exception):
    code: str
    message: str
    status: int = 400
    errors: Optional[Mapping[str, Any]] = None
```

사용 예:

```python
# services/contract.py
def cancel_contract(contract_ulid: str):
    contract = Contract.objects.filter(ulid=contract_ulid).first()
    if not contract:
        raise ApiError(code="NOT_FOUND", message="계약을 찾을 수 없습니다", status=404)
    if contract.status == "completed":
        raise ApiError(
            code="INVALID_STATE",
            message="완료된 계약은 취소할 수 없습니다",
            status=409,
        )
    contract.status = "cancelled"
    contract.save()
    return contract
```

View에서 try/except 없이 서비스를 호출하면, `exception_handler`가 자동으로 `ApiError`를 포맷팅한다.

## 응답 코드 관리

문자열 상수를 흩뿌리지 말고 한 곳에서 관리한다:

```python
class CommonCode:
    OK = "OK"
    INVALID_REQUEST = "INVALID_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class UserCode:
    USER_LIST = "USER_LIST"
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_NOT_FOUND = "USER_NOT_FOUND"
```

코드 값이 클라이언트와의 계약이 되므로, 한 번 정하면 바꾸지 않는다.

## request_id의 가치

모든 응답에 `request_id`가 포함되면:

1. 클라이언트가 에러 리포트 시 `request_id`를 첨부한다
2. 서버 로그에서 해당 `request_id`로 검색하면 전체 요청 흐름을 추적할 수 있다
3. 마이크로서비스 간 호출 시 `request_id`를 전파하면 분산 추적이 가능하다

이 부분은 다음 글 "미들웨어로 횡단 관심사 분리하기"에서 자세히 다룬다.

## 정리

| 항목 | DRF 기본 | Envelope 패턴 |
|------|---------|--------------|
| 성공 응답 | 데이터만 반환 | `{success, code, message, data, meta}` |
| 에러 응답 | 형태 제각각 | `{success, code, message, errors, meta}` |
| 예외 처리 | DRF 기본 handler | 커스텀 handler로 통일 |
| 추적성 | 없음 | `request_id` 포함 |
| 클라이언트 파싱 | 케이스별 분기 | `success` 하나로 분기 |
