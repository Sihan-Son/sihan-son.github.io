---
title: Jupyter Kernel 추가하기
date: "2022-10-29T10:00:41+09:00"
section: python
slug: jupyter-kernel
thumbnail: /images/python/jupyter-setting/envs.png
categories:
  - Python
tags:
  - Python
  - jupyter
  - anconda
  - envs
---


파이썬을 이용하다보면 프로젝트마다 필요한 라이브러리들이 다르고 파이썬의 버전도 다른경우가 대부분입니다. 그래서 다양한 가상환경 세팅을 위한 라이브러리들과 환경들이 존재합니다. 제목처럼 `Anaconda`에서 가상환경을 만들고 `jupyter`에 커널을 연결하는 방법을 소개드리겠습니다.

# 1. 환경만들기

```script
conda create -n [env name] [python=ver]
```

`Anaconda Prompt`에서 위와 같이 입력을 하시면 가상환경이 만들어집니다. 환경변수를 설정해놓으셨다면 윈도우 기준 꼭 `Anaconda Prompt`가 아니어도 CMD 등 에서도 가능합니다.

- [env name] 옵션은 여러분이 만든 가상환경에 붙는 이름입니다.
- [python=ver]은 필요할 경우 기입하시면 됩니다. 특정 파이썬 버전이 필요하시면 해당 버전을 기입하시면 됩니다. 옵션을 주지 않는 경우 `Anaconda`의 기본 버전으로 파이썬이 설정됩니다.

# 2. 환경 확인하기

```
conda info --envs
```

`Anaconda`가상환경 목록 확인이 필요할 경우 위 명령어를 통해 만들어진 환경들을 볼 수 있습니다.

![envs](/images/python/jupyter-setting/envs.png)

# 3. 사용하기

환경을 만들고 해당 환경을 사용하고 라이브러리 설치를 위해선 활성화를 주어야합니다.

```
# 활성화
conda activate [env name]

# 비활성화
conda deactivate
```

- [env name] 활성화하려는 환경

![act](/images/python/jupyter-setting/activate.png)  
`activate`를 이용해 활성화 시키면 경로 이름 앞에 위 이미지처럼 환경이름이 표시됩니다.

![deact](/images/python/jupyter-setting/deactivate.png)  
`deactivate`를 실행하면 환경이름이 사라지고 현재 경로이름만 표시가 됩니다.

# 4. Jupyter에 커널 연결하기

프롬포트를 실행시키고 연결이 필요한 환경을 활성화 해줍니다. 활성화가 되면 `jupyter`연결을 위해 `ipykernel`을 설치 해줍니다.

```
pip install ipykernel
```

`ipykernel`이 설치 되면 아래 명령어로 `jupyter`환경에 커널을 연결합니다.

```
python -m ipykernel install --user --name [env name] --display-name [display name]
```

- [env name]은 `conda info`를 통해 표시되는 여러분이 만들 떄 사용한 이름입니다.
- [display name]은 `jupyter`환경에서 커널을 선택할 때 표시되는 이름입니다.

[env name]과 [display name]을 꼭 동일하게 맞출 필요는 없습니다.

# 5. 커널 연결 해제하기

```
jupyter kernelspec uninstall [display name]
```

더 이상 해당 커널을 `jupyter`환경에서 사용하지 않을 경우 위 명령어를 통해 연결을 해제할 수 있습니다. 커널 연결만 해제 할 뿐 가상환경은 유지됩니다.

# 6. 환경 삭제

```
conda remove -n [env name] --all
```

가상환경이 모든 쓸모를 다하고 더 이상 필요가 없어진 경우 위의 방법으로 삭제하시면 됩니다.
