---
title: Triton Inference Server perf_analyzer 사용하기
date: "2025-02-01T21:14:20+09:00"
section: triton
slug: perf_analyzer
thumbnail: /images/thumbnails/perf_analyzer.svg
categories:
  - Triton
tags:
  - triton
  - TIS
  - ai
  - internece
---

# 1. Docker Image
`perf_analyzer`를 사용하기 위해서는 `nvcr.io/nvidia/tritonserver:<RELEASE>-py3-sdk`를 사용해야 한다. 인퍼런스 서버 구성을 위해서는 `sdk`가 붙지 않은 버전을 이용해도 문제가 없으나 해당 버전들에서는 `perf_analyzer`를 위한 환경이 구성되어 있지 않아 권장되지 않는다.   
* `<RELEASE>`는 23.03 이후 버전만 가능하다. 

# 2. Docker Compose로 구성해서 사용하기
``` docker
triton_server:
    image: nvcr.io/nvidia/tritonserver:23.08-py3
    networks:
        - tis_net
    
    ports:
      - 8000:8000 # HTTP 포트
```
인퍼런스를 담당하는 서버의 http나 grpc 중 사용하는 포트를 원하는 포트로 바인딩 해주면 된다. 같은 네트워크 내에선 크게 문제 없이 사용할 수 있다. 해당 예제에서는 `tis_net`이라는 이름으로 네트워크를 만들어서 할당해 주었다. `perf_analyzer`에게도 같은 네트워크를 할당해 통신 할 수 있게 했다.

```docker
 perf_analyzer:
    image: nvcr.io/nvidia/tritonserver:23.08-py3-sdk
    networks:
        - tis_net
    
    volumes:
    - ./dataset:/workspace/dataset
    
    entrypoint: "/bin/bash"

```

`sdk` 이미지를 사용해서 컨테이너를 실행하면 기본 위치는 `workspace`이다. 랜덤 값을 이용해 성능 테스트를 할 예정이 아니기에 인풋데이터를 마운트해서 사용하다. 

# 3. perf_analyzer 사용하기

```bash
perf_analyzer -m <model_name> -u <triton_server_url:port>
```
위 형태가 가장 기본적인 사용 형태이다. `<model_name>`에는 성능 분석을 하고자하는 모델의 이름을 넣으면 된다. `-u`옵션은 트리톤 서버의 주소를 입력하는 옵션이다. `<triton_server_url>`에는 `docker compose`로 구성을 전제하면 인퍼런스 서버를 담당하는 컨데이터 이름을 넣어주면 된다. `<port>`에는 현재 예제에서는 `http`를 이용할 예정이기 때문에 `8000`을 입력하면 된다. 

모델 구성에 따라서는 명시적인 인풋이 필요한 경우가 있다. 그 경우에는 뒤에 `--input-data <JSON File>`을 추가해주면 된다. `dataset/input.json`에 내용이 구성되어 있다면 다음과 같은 명령어를 입력하면 된다. 


```bash
perf_analyzer -m <model_name> -u <triton_server_url:port> --input-data dataset/input.json
```

`--input-data`는 명령어를 실행하는 위치에서 상대 경로로 입력하거나 절대 경로를 이용해 사용할 수 있다. 


## input.json  구성하기
입력을 위한 JSON 파일은 사용하는 모델의 최초 인풋에 맞춰 구성하면 된다. 나의 경우 별도 마운트 된 볼륨에 저장되는 파일을 읽어 인퍼런스를 하는 형태를 취해 아래와 같은 인풋 구조가 필요했다. 

```json
input [
    {
        name: "data_path"
        data_type: TYPE_STRING
        dims: [-1]
    },
    {
        name: "age"
        data_type: TYPE_FP32
        dims: [-1]
    },
    {
        name: "gender"
        data_type: TYPE_FP32
        dims: [-1]
    },
    {
        name: "name"
        data_type: TYPE_STRING
        dims: [-1]
    }
]
```

이런 형태의 인풋을 받는 경우 라면 다음과 같이 구성하면 된다. 

```json
{
    "data":
    [
        {
            "data_path":["file_path"],
            "age": [32.0],
            "gender": [0.0],
            "name":["kim"]
        }
    ]
}
```

이 처럼 단건의 내용만 있거나 배열 형태로 여러 데이터를 추가해도 된다. 인풋에 정의한것과 동일한 데이터 형으로 내용을 구성하면된다. 

이렇게 데이터를 줂비해서 3절에 있는 명령어를 입력해도 실행이 되지 않고 오류를 만나게 된다. 

```bash
error: Failed to init manager inputs: The variable-sized tensor "age" with model shape [-1] needs to have its shape fully defined. See the --shape option.
```

이유는 인풋을 구성을 보면 `dims:[-1]`로 되어있다. 그래서 명시적인 차원을 `--shape` 옵션으로 요구하는 것이다. 

## --shape 
```bash
perf_analyzer -m <model_name> -u <triton_server_url:port> --input-data dataset/input.json  --shape age:1 --shape gender:1 --shape name:1 --shape data_path:1
```

`--shape` 옵션은 각 인풋 변수의 이름을 적고 해당 콜른(:) 뒤에 차원을 기재하면 된다. 즉 `--shape input_0:dim --shape input_1 dim ... input_9:dim` 이런 형태로 사용하면 된다. 