---
title: "DRF JWT 인증 커스터마이징 - SimpleJWT 실전 가이드"
date: 2026-02-14
section: drf
slug: drf-jwt-authentication
thumbnail: /images/thumbnails/drf-jwt-authentication.svg
categories:
  - Django REST Framework
tags:
  - drf
  - jwt
  - authentication
  - simplejwt
---

DRF의 기본 인증은 Session과 Token 방식이다. 하지만 SPA나 모바일 앱과 통신하는 API 서버라면 JWT(JSON Web Token)가 표준이 되었다. `djangorestframework-simplejwt`를 기본 설정 그대로 쓰지 말고, 실무에 맞게 커스터마이징하는 방법을 정리한다.

## SimpleJWT 기본 설정

```bash
pip install djangorestframework-simplejwt
```

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # 토큰 무효화 지원
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

핵심 설정을 하나씩 보자.

## Access Token과 Refresh Token

```
클라이언트                    서버
   │                          │
   ├── POST /auth/login ─────►│ (아이디/비밀번호)
   │◄── access + refresh ─────│
   │                          │
   ├── GET /api/users ────────►│ (Authorization: Bearer <access>)
   │◄── 200 OK ───────────────│
   │                          │
   │  ... 30분 후 access 만료 ...
   │                          │
   ├── GET /api/users ────────►│ (만료된 access)
   │◄── 401 Unauthorized ─────│
   │                          │
   ├── POST /auth/refresh ────►│ (refresh token)
   │◄── 새 access + refresh ──│
   │                          │
```

- **Access Token**: 짧은 수명 (30분). 매 요청에 사용
- **Refresh Token**: 긴 수명 (30일). Access Token 갱신에만 사용

### ROTATE_REFRESH_TOKENS

`True`로 설정하면 refresh 요청 시 새 refresh token도 함께 발급한다. 클라이언트는 항상 최신 refresh token을 저장해야 한다.

### BLACKLIST_AFTER_ROTATION

`True`로 설정하면 이전 refresh token을 블랙리스트에 등록한다. 탈취된 refresh token으로 재발급이 불가능해진다. 이를 위해 `rest_framework_simplejwt.token_blacklist` 앱이 필요하다.

```bash
python manage.py migrate  # 블랙리스트 테이블 생성
```

## Custom Authentication 클래스

SimpleJWT의 기본 `JWTAuthentication`은 Django의 `User` 모델 하나만 지원한다. 실무에서는 내부 사용자와 외부 클라이언트 등 **여러 유저 타입**을 처리해야 할 수 있다.

```python
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed):
            raise
        except Exception as e:
            logger.warning(f"JWT authentication error: {e}")
            raise AuthenticationFailed("인증 처리 중 오류가 발생했습니다")

    def get_user(self, validated_token):
        user_type = validated_token.get("user_type", "user")
        user_id = validated_token.get("user_seq")

        if not user_id:
            raise InvalidToken("토큰에 사용자 정보가 없습니다")

        if user_type == "user":
            user = InternalUser.objects.filter(pk=user_id).first()
        elif user_type == "client":
            user = ClientUser.objects.filter(pk=user_id).first()
        else:
            raise InvalidToken(f"알 수 없는 사용자 유형: {user_type}")

        if user is None:
            raise AuthenticationFailed("사용자를 찾을 수 없습니다")

        return user
```

`get_user()`를 오버라이드해서 토큰의 `user_type` 클레임에 따라 다른 모델에서 사용자를 조회한다.

## 커스텀 토큰 클레임

기본 JWT payload에 추가 정보를 넣으려면:

```python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # 커스텀 클레임 추가
        token["user_type"] = "user"
        token["user_seq"] = user.pk
        token["email"] = user.email
        token["role"] = user.role

        return token
```

View에서 사용:

```python
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

## Multi-Backend 인증

Django의 `AUTHENTICATION_BACKENDS`를 활용해 여러 인증 방식을 지원할 수 있다:

```python
# settings.py
AUTHENTICATION_BACKENDS = [
    "apps.auth.backends.MultiUserBackend",
]
```

```python
from django.contrib.auth.backends import BaseBackend


class MultiUserBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, user_type=None, **kwargs):
        if user_type == "user":
            # 내부 사용자: 이메일로 조회
            try:
                user = InternalUser.objects.get(email=username)
                if user.check_password(password):
                    return user
            except InternalUser.DoesNotExist:
                return None

        elif user_type == "client":
            # 외부 클라이언트: 아이디로 조회
            try:
                user = ClientUser.objects.get(username=username)
                if user.check_password(password):
                    return user
            except ClientUser.DoesNotExist:
                return None

        return None
```

## 인증 엔드포인트 구성

```python
# urls.py
urlpatterns = [
    # 내부 사용자
    path("auth/login", LoginView.as_view()),
    path("auth/refresh", TokenRefreshView.as_view()),
    path("auth/logout", LogoutView.as_view()),

    # 외부 클라이언트 (OTP 기반)
    path("clients/otp/request", OtpRequestView.as_view()),
    path("clients/otp/verify", OtpVerifyView.as_view()),
]
```

로그아웃은 refresh token을 블랙리스트에 추가하는 방식으로 구현한다:

```python
from rest_framework_simplejwt.tokens import RefreshToken


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return fail(code="INVALID_REQUEST", message="refresh 토큰이 필요합니다")

        try:
            token = RefreshToken(refresh)
            token.blacklist()
            return ok(code="LOGGED_OUT", message="로그아웃 완료", request=request)
        except Exception:
            return fail(code="INVALID_TOKEN", message="유효하지 않은 토큰입니다")
```

## USER_ID_FIELD 설정

Django 기본 `User` 모델의 PK가 아닌 다른 필드를 사용한다면:

```python
SIMPLE_JWT = {
    "USER_ID_FIELD": "user_seq",      # 모델의 PK 필드명
    "USER_ID_CLAIM": "user_seq",      # JWT payload의 클레임 키
}
```

커스텀 User 모델에서 PK 필드명이 `id`가 아닌 `user_seq`일 때 이 설정이 필요하다.

## 보안 체크리스트

- [ ] Access Token 수명을 15~30분으로 제한
- [ ] Refresh Token rotation 활성화 (`ROTATE_REFRESH_TOKENS = True`)
- [ ] 토큰 블랙리스트 활성화 (`BLACKLIST_AFTER_ROTATION = True`)
- [ ] HTTPS 전용 환경에서 운영
- [ ] Refresh Token은 httpOnly cookie 또는 안전한 저장소에 보관
- [ ] 토큰에 민감 정보 (비밀번호, 개인정보) 포함하지 않기
- [ ] 만료된 블랙리스트 토큰 주기적 정리 (`python manage.py flushexpiredtokens`)

## 정리

| 설정 | 기본값 | 권장값 | 이유 |
|------|--------|--------|------|
| ACCESS_TOKEN_LIFETIME | 5분 | 15~30분 | UX와 보안의 균형 |
| REFRESH_TOKEN_LIFETIME | 1일 | 7~30일 | 사용 패턴에 따라 |
| ROTATE_REFRESH_TOKENS | False | True | 토큰 탈취 방지 |
| BLACKLIST_AFTER_ROTATION | False | True | 이전 토큰 무효화 |
| ALGORITHM | HS256 | HS256 | 단일 서버면 충분 |

SimpleJWT는 기본 설정이 보수적이어서 실무 환경에 맞게 튜닝이 필요하다. 특히 다중 유저 타입, 커스텀 클레임, 토큰 블랙리스트는 거의 모든 프로젝트에서 필요한 커스터마이징이다.
