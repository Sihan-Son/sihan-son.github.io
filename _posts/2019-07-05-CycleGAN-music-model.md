---
layout: post
title:  "Symbolic Music Genre Transfer with CycleGAN(4)"
date:   2019-07-05
excerpt: "MUSIC domain transfer, paper review"
sitemap :
  changefreq : daily
  priority : 1.0
tag:
- GAN
- music
- CycleGAN
- transfer
- genre
- paper review
- graduation
- midi
comments: true
---

# Index
- <a href='https://sihan-son.github.io/CycleGAN-music-intro'>Intro</a>
- <a href='https://sihan-son.github.io/CycleGAN-music-related'>Related Work</a>
- <a href='https://sihan-son.github.io/CycleGAN-music-model'>Model Architecture</a>
- <a href='https://sihan-son.github.io/CycleGAN-music-pre'>Dataset and Preprocessing</a>
- <a href=''>Architecture Parmeters and Training</a>
- <a href=''>Experimental Results</a>
- <a href=''>Conclusion</a>

이 논문에서 사용하는 모델은 `Generative adversarial network(GAN)`에 기반을 두고 있습니다. Ian Goodfellow et al<sup><a href="#paper01">1</a></sup>에서 제안 된 기존의 모델에서는 `Generator G`와 `Discriminator D`가 존재 합니다. `G`는 노이즈를 실제 데이터 처럼 만드는 역할을 합니다. `D`는 `G`가 만들어낸 가짜 데이터와 실제 데이터를 구별하는 역할을 합니다.  

`Music domain transfer`이기 때문에 `input`데이터는 노이즈가 아니라 실제 음악 데이터이고, 본 논문에서는 음악 데이터중에서 `MIDI` 데이터를 사용합니다. 해당 논문에서는 두 장르 사이의 변환만 다루기 때문에 `target`데이터는 다른 장르의 음악입니다. 그렇기 때문에 `transfer`는 대칭적이어야 합니다. 그래서 `CycleGAN`을 네트워크 구성에 사용하게 됩니다.  

`CycleGAN`은 기본적으로 순환 방식으로 배열되고 조화롭게 훈련된 2개의 `GAN`으로 구성됩니다. `G`의 하나는 `A to B`, 다른 `G`는 `B to A`로 동작하고 `D`는 `G`의 `output`에 붙게 됩니다. 

<img src='https://sihan-son.github.io/public/CycleGAN_music_review/Picture1.png'>  
---
## 이 파트는 MathJax 설정을 못잡아서 추후에 보충하겠습니다..


<code>G <sub>A->B</sub></code>: A 장르를 B 장르로 바꾸는 `G`  
<code>G <sub>B->A</sub></code>: B 장르를 A 장르로 바꾸는 `G`  
<code>D<sub>A</sub></code>, <code>D<sub>B</sub></code>: 첨자 장르를 위한 `D`  
<code>D<sub>A,m</sub></code>, <code>D<sub>B,m</sub></code>: `extra Discriminator`이며, `G`가 `high level feature`를 학습 할 수 있게 해줌  
<code>M</code>: 여러 도메인을 가지고 있는 data sets

X<sub>A</sub>는 원본 도메인이다.  
$\\hat{A}_B\\$ = G <sub>A->B</sub>(X<sub>A</sub>)  
$\\tilde{A}_A\\$ =  
G <sub>B->A</sub>(G <sub>A->B</sub>(X<sub>A</sub>))  

\\[ \frac{1}{n^{2}} \\]  
\\( 1/x^{2} \\)

--- 

## Cycle Consistency Loss

학습의 안정성을 위해 `Cycle Consistency Loss`를 사용합니다. `Cycle Consistency Loss`는 `mapping`을 보장하는 역할을 수행합니다. `Cycle Consistency Loss`가 없을 경우 `posterior collapse`또는 `mode collapse`라는 현상을 경험할 수 있습니다. 이 현상은 <a href="">이 글</a>을 참조해 주세요. `G`가 입력 데이터를 무시하지 않고 필요한 정보를 남기고 `invert`할 수 있게 하는 `regularizer`의 역할 수행합니다.   

---
`GAN` 학습은 안정적이지 못하기 때문에 밸런스 조절이 필요합니다. `D`가 너무 강력해서 초반부터 `G`를 압도하게 되면 `local optima`의 위험을 가지고 있습니다. `G`가 `D`를 속이기 위해서는 두 장르의 특징에 대해 효과적으로 학습을 진행해야 합니다. 하지만 음악 장르는 독특한 패턴을 가질 확률이 높기 때문에 `D`를 속이기 위한 패턴을 만들 확률이 높습니다. `D`를 속인다고 해서 반드시 들을만한 음악이 나오는 것이 나오진 않습니다. 들을 만한 음악을 만들기 위해선 `high level feature`가 필요합니다. 그래서 두 개의 `extra D (D_x)`를 도입합니다. 기존의 `D`는 fake/real 구분을 하고 `D_x`는 `G`가 `music manifold`에 잔류하게 도와줍니다. 이를 통해 그럴듯하고 실제적인 음악을 만들어 줍니다. `G`가 대부분의 입력 구조를 유지하게 하여 원복 조각을 장르 변화 이후에도 유지 할 수 있게 합니다. 

---
<a id="paper01">1.</a> Generative Adversarial Nets