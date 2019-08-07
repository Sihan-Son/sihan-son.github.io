---
layout: post
title:  "쉽게 따라하는 Tensorflow-gpu Setting with anaconda"
date:   2019-07-04
excerpt: "Tensorflow-gpu를 anaconda로 쉽게 세팅해봅시다."
sitemap :
  changefreq : daily
  priority : 1.0
setting: true
tag:
- Setting
- tensorflow
- GPU
- anaconda
- ML
comments: true
---

`Tensorflow`를 사용하면서 제일 힘든 작업은 `GPU`를 이용한 환경을 세팅하는 일이다. `CUDA`, `cuDNN`등 여러 패키지를 설치해야하고, 또 따라하라는데로 따라하는데 블로그 글들이 업데이트가 되어 있지 않아서 버전 오류가 발생하기도 한다. 그래서 간단한 방법을 소개하려고 한다.   

먼저 `anaconda`가 필요하다. `anaconda`는 과학용 파이썬 패키지를 묶어서 배포하는 배포판 인데 이 내용은 다음에 알아보도록 하고, `anaconda`가 설치 되어 있다는 사람들을 대상으로 글을 쓴다. 혹시 `anaconda` 설치가 필요하다면 <a href='https://dev-hani.tistory.com/10'>이 글</a>을 참조해서 설치하길 바란다.  

먼저 `python` 버전이 `tensorflow`와 호환되는 버전이지 확인이 필요하다. `anaconda`로 설치된 `python`버전이 `tensorflow`를 지원하지 않는 버전일 경우 `anaconda prompt`를 실행해 `conda install python=<VER>` \<VER>를 `tensorflow`를 지원 하는 버전으로 바꿔주면 `python`의 버전이 낮아지게 된다.  

`tensorflow-gpu`를 설치 하기 위한 기본적인 준비가 끝났다. 이제 남은 작업은 `anaconda prompt`에서 
<pre><code>conda install tensorflow-gpu</code></pre>
를 해주면 입력해주면 자동으로 `CUDA`와 `cuDNN`이 모두 자동으로 잡히기 때문에 `tensorflow-gpu`를 사용하기 위한 준비가 끝났습니다! 이제 열심히 머신러닝 공부를 하세요!