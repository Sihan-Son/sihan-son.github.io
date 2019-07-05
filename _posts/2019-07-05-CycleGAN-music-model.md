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

<code>G <sub>A->B</sub></code>: A 장르를 B 장르로 바꾸는 `G`  
<code>G <sub>B->A</sub></code>: B 장르를 A 장르로 바꾸는 `G`  
<code>D<sub>A</sub></code>, <code>D<sub>B</sub></code>: 첨자 장르를 위한 `D`  
<code>D<sub>A,m</sub></code>, <code>D<sub>B,m</sub></code>: `extra Discriminator`이며, `G`가 `high level feature`를 학습 할 수 있게 해줌  
<code>M</code>: 여러 도메인을 가지고 있는 data sets

$\hat{A}$  
$\tilde{A}$
---
<a id="paper01">1.</a> Generative Adversarial Nets