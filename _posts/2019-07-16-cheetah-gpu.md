---
layout: post
title:  "[Cheetah] 딥러닝용 GPU 플랫폼"
date:   2019-07-16
excerpt: "GPU Server for deep learning"
sitemap :
  changefreq : daily
  priority : 1.0
tag:
- GPU
- tensorflow
- ML
- Cheetah
- event
comments: true
---

`Deep Learning`을 공부하거나 프로젝트를 진행하려면 `GPU`는 필수적입니다. 저의 경우는 `GTX 970`모델을 이용 중이었지만 학습으로 갈궈지고, 오버워치를 하다가 퍽 하고 전원이 나가더니 죽어버리는 불상사를 겪었습니다.  

졸업 프로젝트로 `Deep Learning`관련 프로젝트를 진행하고 있어서 `GPU`가 절대적으로 필요한 상황이었는데 그나마 있던 `GPU`가 죽어서 정말 곤란한 상황이 되었습니다. 그러던 중 `머신러닝 플랫폼 서비스`를 오픈해서 베타 서비스를 진행중인 [`Cheetah`]('https://www.n3ncloud.co.kr/cheetah/')라는 플랫폼을 알게 되었습니다. 마침 베타 테스터들에게 한달간 무료로 GPU 서버를 대여 해주고 있어서 `RTX 2080TI` 서버를 대여해 사용할 수 있었습니다.

프로젝트를 위해서 `PYTHON`패키지 중에서 `pretty_midi`와 `pypianoroll`이라는 두 패키지가 필수적이었습니다. 그런데 서버 배정을 신청할때 `tensorflow`&`keras` 환경을 선택하였을 떄 디폴트로 설치된 `scipy`와 버전 `dependency error`가 발생 하였습니다. 그래서 제가 처음으로 선택한 방법은 `conda 가상환경`이었습니다. 하지만 이 방법으로는 `GPU`를 사용할 수가 없어서 포기하게 되었습니다. 문제는 이 방법을 시도한 날이 금요일 6시 이후여서 기술 지원을 받기 위해선 주말이 지나가야해서 깡 CPU 학습을 진행했습니다.  

기술 지원 문의를 하자 충격적인 답변을 받았습니다. 제공받은 환경이 컨테이기 때문에 여기에서 가상환경을 만들어서는 `GPU`를 사용할 수 없다라는 답변을 받았습니다. 그리고 `dependency error` 해결을 위한 방법을 제공받았습니다. 

1. `sudo`권한을 줄 때 `-H` 옵션을 주어서 설치
2. `pip install` or `conda install`을 할 때 `--ignore-installed` 옵션으로 설치

전 2번 방법으로 문제를 해결 했습니다. 문제가 해결되자 `epoch`당 2시간이 걸리던 `CPU`학습이 208초라는 경이로운 시간으로 줄었습니다.  

혹시 `머신러닝 플랫폼 서비스`를 찾으신다면 비용이 발생하겠지만 한국어로 기술문의가 가능한 `Cheetah`도 하나의 선택지가 될 수 있을 것 같습니다.

---
본 포스트는 [`Cheetah`]('https://www.n3ncloud.co.kr/cheetah/')에서 GPU 서버를 한달 제공 받아 작성되었습니다.