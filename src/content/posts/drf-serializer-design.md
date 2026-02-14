---
title: "DRF Serializer 설계 철학 - 입력과 출력을 분리하라"
date: 2026-02-14
section: drf
slug: drf-serializer-design
thumbnail: /images/thumbnails/drf-serializer-design.svg
draft: true
categories:
  - Django REST Framework
tags:
  - drf
  - serializer
  - design pattern
  - architecture
---

DRF 튜토리얼을 따라하면 하나의 `ModelSerializer`로 모든 걸 해결한다. 하지만 실무에서 이 접근은 빠르게 한계에 부딪힌다. Serializer를 **용도별로 분리**하는 것이 DRF를 제대로 쓰는 첫 걸음이다.

## 하나의 Serializer로 모든 것을 하려 할 때

```python
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
```

이 serializer가 감당해야 하는 역할을 보자.

- **생성** 시: `task_name`, `start_date`, `due_date`만 받아야 한다
- **수정** 시: `task_name`과 `status`만 변경 가능하다
- **조회** 시: `task_ulid`, `created_at`, 연관된 `submissions` 목록까지 보여줘야 한다

`fields = '__all__'`은 이 세 가지를 전부 만족시킬 수 없다.

## 용도별 Serializer 분리

### Create Serializer: 필요한 필드만 명시

```python
class TaskCreateSerializer(serializers.Serializer):
    task_name = serializers.CharField(max_length=255)
    unit_ulid = serializers.CharField()
    start_date = serializers.DateField()
    due_date = serializers.DateField()
    type = serializers.ChoiceField(choices=TaskType.choices)
    status = serializers.ChoiceField(
        choices=TaskStatus.choices,
        default=TaskStatus.DRAFT,
    )
```

`ModelSerializer`가 아니라 `Serializer`를 쓴다. 모델과 1:1 매핑이 아닌, **이 API가 받아야 하는 입력**을 정의하는 것이다.

### Update Serializer: 모든 필드를 optional로

```python
class TaskUpdateSerializer(serializers.Serializer):
    task_name = serializers.CharField(max_length=255, required=False)
    start_date = serializers.DateField(required=False)
    due_date = serializers.DateField(required=False)
    status = serializers.ChoiceField(choices=TaskStatus.choices, required=False)
```

PATCH 요청은 일부 필드만 보낸다. `required=False`로 모든 필드를 선택적으로 만든다.

### Output Serializer: 응답에 맞는 형태

```python
class TaskSerializer(serializers.Serializer):
    task_ulid = serializers.CharField()
    task_name = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    start_date = serializers.DateField()
    due_date = serializers.DateField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
```

조회용 serializer는 클라이언트에게 보여줄 필드만 담는다. `created_by_user_id` 같은 내부 FK는 노출하지 않는다.

### Nested Serializer: 상세 조회 확장

```python
class TaskDetailSerializer(TaskSerializer):
    submissions = SubmissionSerializer(many=True, read_only=True)
    assignee_name = serializers.SerializerMethodField()

    def get_assignee_name(self, obj):
        if obj.assignee:
            return obj.assignee.name
        return None
```

리스트 조회와 상세 조회의 응답이 다를 때, 상속으로 확장한다.

## 왜 ModelSerializer를 안 쓰나?

`ModelSerializer`가 나쁜 건 아니다. 하지만 몇 가지 함정이 있다.

### 1. 모델과 API의 결합

```python
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
```

모델에 컬럼을 추가하면 API 응답에도 자동으로 노출된다. `password_hash` 같은 필드가 실수로 포함될 수 있다.

### 2. 입력 검증의 혼란

`ModelSerializer`는 모델의 `blank`, `null`, `default` 설정을 자동으로 serializer 필드에 반영한다. 모델에서는 `null=True`이지만 API에서는 필수값이어야 하는 경우가 많다.

### 3. 명시성

```python
# ModelSerializer: 어떤 필드가 있는지 모델을 봐야 안다
class Meta:
    model = Task
    exclude = ('internal_note', 'deleted_at')

# Serializer: 여기에 다 보인다
task_name = serializers.CharField(max_length=255)
status = serializers.CharField()
```

API 문서를 serializer만 보고 이해할 수 있어야 한다.

## source와 SerializerMethodField 활용

### FK를 정수 ID로 노출

```python
class InvoiceSerializer(serializers.Serializer):
    contract_seq = serializers.IntegerField(source="contract_seq_id")
    user_seq = serializers.IntegerField(source="user_seq_id", allow_null=True)
```

Django FK 필드의 실제 DB 컬럼명(`contract_seq_id`)을 `source`로 지정하면, 모델 인스턴스에서 추가 쿼리 없이 ID 값만 가져온다.

### 관련 데이터 커스텀 직렬화

```python
class UnitSerializer(serializers.Serializer):
    task_ulids = serializers.SerializerMethodField()

    def get_task_ulids(self, obj):
        return list(obj.tasks.values_list("task_ulid", flat=True))
```

`SerializerMethodField`는 모델에 없는 계산된 값을 포함할 때 쓴다. N+1 쿼리에 주의하고, `prefetch_related`와 함께 사용해야 한다.

## 커스텀 필드

multipart 요청에서 JSON 배열을 문자열로 받아야 하는 경우:

```python
class _JsonListField(serializers.Field):
    def to_internal_value(self, data):
        if isinstance(data, list):
            return data
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        self.fail("invalid")

    def to_representation(self, value):
        return value
```

`to_internal_value`(입력)와 `to_representation`(출력)을 분리해서 구현한다. DRF의 양방향 변환 철학이 잘 드러나는 부분이다.

## Validation 전략

### 필드 레벨

```python
class ContractCreateSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate_end_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("종료일은 오늘 이후여야 합니다")
        return value
```

### 객체 레벨 (필드 간 교차 검증)

```python
    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError({
                    "end_date": "종료일은 시작일 이후여야 합니다"
                })
        return data
```

필드 레벨 검증이 먼저 실행되고, 통과한 후 `validate()`가 호출된다. 에러 메시지에 필드명을 key로 넣으면 DRF가 해당 필드에 에러를 매핑해준다.

## 정리: Serializer 설계 원칙

1. **입력과 출력을 분리하라** - `CreateSerializer`, `UpdateSerializer`, `OutputSerializer`
2. **모델이 아니라 API 계약을 기준으로** - `Serializer` > `ModelSerializer`
3. **명시적으로 필드를 선언하라** - `fields = '__all__'` 지양
4. **상속으로 확장하라** - List용 → Detail용으로 nested 추가
5. **Validation은 serializer에서** - View에 검증 로직을 넣지 말 것
