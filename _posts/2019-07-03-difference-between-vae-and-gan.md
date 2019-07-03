---
layout: post
title:  "Difference between vae and gan"
date:   2019-07-03
excerpt: "what is difference between vae and gan"
sitemap :
  changefreq : daily
  priority : 1.0
tag:
- GAN
- VAE
- graduation
comments: true
---

# What is difference between VAE and GAN
<img src='https://sihan-son.github.io/public/vng/rough.jpg'>  

`VAE`와 `GAN`은 그림에서 보다시피 `Maximum Likehood`의 범주에 속하는 방법론이다. 그림에서 볼 수 있든 `Explicit`한 방법론과 `Implicit`한 방법론으로 나뉜다. 이 블로그에서 주로 다루는 `GAN`은 보다시피 `Implicit(암시적인)`한 방법론을 취하고 있다.

## VAE
`Variational Autoencoder(AVE)`는 Kingma et al<sup><a href="#paper01">1</a></sup>의 논문에서 제안된 네트워크의 구조이다. 복잡한 데이터 생성 모델을 설계하고 대규모 데이터 세트에 적용을 할 수 있게 해준다. `input`을 `z`로 `encoding`하고 스스로 `input`을 `decoding`하는 방법을 학습하는 방법이다. 즉 `decoding`된 `output`이 `input`과 최대한 가깝게 만들어는 내는 방법이다.  
`Loss Function`은 `input x`와 복원된 `output x'`간의 `Loss`로 정의한다. `VAE`는 모델을 명확히 정의하고 이를 최대화 하는 전략을 택한다. 그래서 예측이 가능하지만 동시에 우리가 아는 것 이상의 성능을 내기가 힘들다는 한계가 존재한다.  `Auto-Encoder`가 `input` 복원하는 것에만 맞게 학습을 하기 때문이다. `Encoding`되는 잠재변수 `z`는 의미론적이지 않다. 

## GAN    
`Generative adversarial network(GAN)`은 Ian J. Goodfellow et al<sup><a href="#paper02">2</a></sup>의 논문에서 제안된 개념이다. 이름 자체를 뜯어보면 `Adversarial`은 대립하는 뜻을 가지고 있어서 `적대적 생성 신경`이라는 뜻의 네트워크 모델이다. 이런 뜻을 가지게 된 이유는 `Discriminator D`와 `Generator G`가 서로 대립하여 학습하면서 성능을 개선해 나가는 구조를 가지고 있기 때문이다. 논문에서 나온 예시로는 위조 지폐를 만드는 `G`가 존재하고, 위조지폐를 `감별 Classify`하는 `D`가 있다. `D`와 `G`는 서로 속이고, 구별하면서 서로 능력이 발전하게 되고, 구별할 확률이 0.5로 수렴하게 된다. 즉 진짜 지폐와 위조 지폐를 구별할 수 없게 된다.  

<img src='https://sihan-son.github.io/public/vng/gan.jpg'>  

노이즈 `p(z)`가 들어오면 `G`는 실제 데이터의 분포와 비슷하게 노이즈를 변형한다. `D`는 `G`가 생성한 이미지와 실제 이미지를 받아서 구분하는 과정을 거친다.

## 차이점
#### VAE
- Data의 분포를 학습하고 싶은데, 이 data가 intractable하기 때문에 variational inference라는 방법으로 풀어보고자 함
- VAE는 data 분포가 잘 학습되기만 하면 sampling(data generation)이 저절로 따라옴

#### GAN
- Model의 목적 자체가 어떤 data의 분포를 학습하는 것이 아님
- 진짜 같은 sample을 generate하는 것이 목적으로 고안된 sampler  

---
<a id="paper01">1.</a> Auto-Encoding Variational Bayes  
<a id="paper02">2.</a> Generative Adversarial Networks

--- 
본 포스팅은 졸업작품을 위한 미팅 자료에 기반을 두고 있습니다. <a href='https://dev-hani.tistory.com'>팀원</a>과 함께 진행하는 프로젝트입니다.