---
title: "DRF에서 APIView를 선택한 이유 - ViewSet과의 철학적 차이"
date: 2026-02-14
section: drf
slug: drf-apiview-vs-viewset
thumbnail: /images/thumbnails/drf-apiview-vs-viewset.svg
categories:
  - Django REST Framework
tags:
  - drf
  - apiview
  - viewset
  - architecture
---

Django REST Framework를 처음 접하면 ViewSet의 마법 같은 편리함에 빠지기 쉽다. `ModelViewSet` 하나로 CRUD가 뚝딱 만들어지니까. 하지만 실무 프로젝트에서 APIView를 의도적으로 선택하는 팀이 많다. 왜 그럴까?

## ViewSet의 편리함과 그 대가

```python
# ViewSet: 5줄로 CRUD 완성
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
```

`ModelViewSet`은 `list`, `create`, `retrieve`, `update`, `partial_update`, `destroy`를 전부 자동 생성한다. Router에 등록하면 URL까지 알아서 만들어준다.

문제는 실무에서 이 6가지 액션이 전부 필요한 경우가 드물다는 것이다. 대부분의 리소스는 생성은 되지만 삭제는 안 되거나, 수정 가능한 필드가 제한적이거나, 리스트와 디테일의 serializer가 다르다.

```python
# 실무에서 흔히 보는 ViewSet의 모습
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreateSerializer
        return UserDetailSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminUser()]
        return [IsAuthenticated()]

    # destroy를 막으려고 오버라이드
    def destroy(self, request, *args, **kwargs):
        return Response(status=405)
```

ViewSet의 편리함을 쓰면서 동시에 그 편리함을 하나씩 꺼나가고 있다.

## APIView: 명시적인 것이 암묵적인 것보다 낫다

```python
class UserListView(APIView):
    permission_classes = [IsAuthenticated]

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


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id: str):
        user = get_user(user_id)
        if not user:
            return fail(code="NOT_FOUND", message="사용자를 찾을 수 없습니다", status=404)
        return ok(code="USER_DETAIL", data=UserDetailSerializer(user).data, request=request)

    def patch(self, request, user_id: str):
        serializer = UserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = update_user(user_id, **serializer.validated_data)
        return ok(code="USER_UPDATED", data=UserSerializer(user).data, request=request)
```

코드가 더 길다. 하지만 읽는 사람이 **이 엔드포인트가 정확히 무엇을 하는지** 바로 알 수 있다. `get`이 뭘 반환하는지, `post`가 어떤 입력을 받는지, 에러 처리는 어떻게 되는지 전부 눈에 보인다.

## APIView를 선택해야 하는 상황

### 1. 리소스별 권한이 다를 때

```python
class CaseListView(APIView):
    def get(self, request):
        # 조직 레벨 권한 체크
        if not has_any_permission(user_ulid, "case.view"):
            return fail(code="FORBIDDEN", message="권한 없음", status=403)
        ...

class CaseDetailView(APIView):
    def get(self, request, case_ulid: str):
        # 오브젝트 레벨 권한 체크
        if not check_permission(user_ulid, "case.view", object_id=case_ulid):
            return fail(code="FORBIDDEN", message="권한 없음", status=403)
        ...
```

리스트 조회와 상세 조회의 권한 체크 로직이 다르다. ViewSet의 `get_permissions()`로도 할 수 있지만, 오브젝트 단위 권한까지 들어가면 `check_object_permissions`를 오버라이드해야 하고, 그 시점에서 ViewSet의 이점은 사라진다.

### 2. 입력/출력 Serializer가 분리될 때

```python
def post(self, request):
    # 입력: CaseCreateSerializer (case_name, start_date, due_date, type)
    serializer = CaseCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    case = create_case(**serializer.validated_data)
    # 출력: CaseSerializer (case_ulid, case_name, status, ...)
    return ok(data=CaseSerializer(case).data, ...)
```

Create/Update/Output serializer가 전부 다른 게 일반적이다. ViewSet의 `get_serializer_class()`로 action별 분기를 타는 것보다, APIView에서 명시적으로 쓰는 게 깔끔하다.

### 3. 서비스 레이어를 사용할 때

APIView는 **Thin Controller** 패턴과 자연스럽게 어울린다.

```
Request → View(검증 + 권한) → Service(비즈니스 로직) → Response
```

View는 HTTP 요청을 받아서 검증하고, 서비스에 위임하고, 결과를 직렬화해서 돌려주는 역할만 한다. ViewSet은 queryset과 serializer에 비즈니스 로직을 넣도록 유도하는 경향이 있다.

## 그래서 ViewSet은 안 쓰나?

아니다. 리소스가 단순한 CRUD이고, 권한 체크가 간단하고, serializer가 하나로 충분하면 ViewSet이 더 효율적이다. 어드민 패널 API나 내부 도구 API에서는 ViewSet이 빛을 발한다.

핵심은 **도구를 알고 선택하는 것**이다. ViewSet의 편리함이 어디서 오는지 이해하고, 그 추상화가 내 요구사항에 맞는지 판단할 수 있어야 한다.

| 기준 | APIView | ViewSet |
|------|---------|---------|
| 코드량 | 많음 | 적음 |
| 가독성 | 명시적 | 암묵적 (convention) |
| 유연성 | 높음 | 커스터마이징 시 오히려 복잡 |
| 권한 분기 | 자연스러움 | `get_permissions()` 오버라이드 |
| Serializer 분기 | 자연스러움 | `get_serializer_class()` 오버라이드 |
| URL 설정 | 수동 | Router 자동 |
| 적합한 프로젝트 | 도메인 복잡도 높은 서비스 | 단순 CRUD, 어드민 API |

다음 글에서는 Create/Update/Output serializer를 분리하는 설계 패턴을 다룬다.
