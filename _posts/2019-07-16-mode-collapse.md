---
layout: post
title:  "간단하게 정리한 Mode Collapse"
date:   2019-07-16
excerpt: "Simple Mode Collapse"
sitemap :
  changefreq : daily
  priority : 1.0
tag:
- GAN
- graduation
- ML
comments: true
---

저는 언제나 처럼 간단하게 이게 어떤 개념인지만 짚고 넘어가겠습니다. 자세한 내용은 다른 학술 블로그들을 참조해 주세요!  


`GAN`관련 논문이나 자료들을 읽다 보면은 심심치 않게 `mode collapse`라는 말을 발견 할 수 있습니다. 여기서 `mode`는 수학에서 말하는 최빈값입니다. 즉 제일 자주 등장하는 값들을 말합니다. `mode collapse`는 보통 `Multi-Modal`일 경우 두드러지게 발생 할 수 있습니다. 튜토리얼로 자주 사용하는 `MNIST`의 경우 '0~9' 10개의 `mode`를 갖게 됩니다.  

`Generator G`가 `input z`를 하나의 `mode`에 치우쳐 변화시키는 현상이 발생합니다. `MNIST`의 경우 `G`가 하나의 숫자만 생성하다가 `Discriminator D`의 값이 진동해 다른 숫자의 분포로 이동해서 `G`가 다른 하나의 숫자를 생성하는 현상을 의미합니다.  

즉 특정 값에 대해서 `G` <-> `D`를 반복하며 올바르지 못한 학습이 진행이되는 현상이 `mode collapse`입니다. 일부 값에만 치우쳐 전체 분포에 대해서 학습하지 못하는 현상입니다. 

<img src='https://sihan-son.github.io/public/gan/mode.png'>

위는 정상적으로 학습 될떄 생성 되는 이미지이고, 아래가 `mode collapse`가 발생한 이미지입니다.

---
이미지는 [Jaejun Yoo's Playground]('http://jaejunyoo.blogspot.com/2017/02/unrolled-generative-adversarial-network-1.html')에서 가져온 이미지입니다