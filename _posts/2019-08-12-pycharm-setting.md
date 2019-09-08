---
layout: post
title:  "쉽게 따라하는 Pycharm interpreter 설정"
date:   2019-08-12
excerpt: "Tensorflow-gpu를 anaconda로 쉽게 세팅해봅시다."
sitemap :
  changefreq : daily
  priority : 1.0
setting: true
tag:
- Setting
- pycharm
- python
- anaconda
comments: true
---

오늘 알아볼 내용은 `Pycharm`에서 `Python interpreter`설정입니다. 잘나온 `Python IDE`가 여러가지라 취향에 따라서 `Jupyter`, `vscode`, `spyder` 등등 여러가지 사용하고 계실겁니다.  이 글은 그중에서 `Pycharm` 사용하시려는 분 중에서 `interpreter`설정에서 문제를 격고 계신 분들을 위한 포스팅입니다.  


## 1. 기본 interpreter 설정하기!

<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/1.png">  
fig 1

`interpreter` 설정을 위해서 파란색으로 하이라이트 되어 있는 `setting`을 눌러줍니다.

<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/2.png">  
fig 2   

<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/3.png">  
fig 3 


이제 `fig 2`이미지에서 좌측 메뉴의 `Project Interpreter`를 들어가면 처음이시면 `fig 2`처럼 빈 화면이 뜨게 됩니다. 이제 우측 상단의 빨간 동그라미 표시된 톱니 바퀴를 누르게 되면 `fig 3`과 같이 `Add`와 `Show all`이 나옵니다. 여기서 `Add`를 눌러주세요


<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/4.png">  
fig 4  

이제 `interpreter` 설정화면에서 좌측 메뉴 중 `System Interpreter`를 들어가서 우측 상단의 붉은 원의 `...`을 클릭해서 `python`이 설치된 위치를 찾아서 추가해주면 됩니다!

<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/5.png">  
fig 5  

그러면 이제 `fig 5`와 같은 화면이 나옵니다. 저는 `anaconda` 환경을 사용중인데 `python`만 설치해서 사용중이신 분은 패키지 목록이 달라도 잘못이 아니니까 걱정하지 마세요.


## 2. 새 프로젝트를 위한 interpreter 설정!

<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/6.png">  
fig 6  

`fig 1`에서 `New Project`를 누르면 `fig 6`과 같은 화면이 나타납니다. 여기서 다들 크게 하시는 실수가 빨간 동그라미의 유무를 모르시는데 이것 때문에 프로젝트마다 새로운 가상환경이 잡히는 경우가 발생합니다. 이제 빨간 동그라미의 삼각형을 눌러주세요. 좌측에 메뉴들이 많은데 이건 제가 `Pycharm Pro`버전을 사용하기 때문에 그렇습니다. 

<img src = "https://sihan-son.github.io/public/setting/pycharmInterpreter/7.png">  
fig 7  

이미지처럼 `New environment using`, `Existing Interperter` 두 메뉴가 있습니다. 1단계에서 설정한 `interpreter`를 사용하고 싶으시면 아래의 `Existing Interpreter`를 선택해주시고, 새로운 가상환경을 사용하고 싶으시면 위의 `New environment using`을 선택해 주시면 됩니다. 