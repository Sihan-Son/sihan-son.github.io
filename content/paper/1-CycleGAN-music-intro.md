---
title: "Symbolic Music Genre Transfer with CycleGAN(1)"
date: 2019-06-29T00:49:14+09:00
tags: ["gan", "music", "CycleGAN", "genre", "ML", "DL"]
categories:
  - paper
  - gan
type: post
---

졸업 작품으로 `Generative adversarial network(GAN)`을 이용해 작곡을 하려고 했다. 프로젝트 진행을 위해 자료 수집을 진행하며 지도 교수님과 이야기를 통해 작곡에서 `domain transfer` 즉 음악의 편곡으로 방향을 선회해 프로젝트를 진행하게 되었다. 핵심적으로 본 논문들을 리뷰하면서 공부한 내용을 정리하고자 한다. 수학적 베이스가 약해서 논문을 읽으면서 가장 힘들었던 부분이 Loss function에 관한 내용이었던 만큼 이 부분의 감안하고 읽어 주세요. 논문 리뷰 이후에 github에 공개된 코드를 리뷰해 보려고 합니다

처음으로 살펴볼 논문은 [Symbolic Music Genre Transfer with CycleGAN](https://arxiv.org/abs/1809.07575)입니다.

# Index

- [Intro](/paper/1-cyclegan-music-intro)
- [Related Work](/paper/2-cyclegan-music-related)
- [Model Architecture](/paper/3-cyclegan-music-model)
- [Dataset and Preprocessing](/paper/4-cyclegan-music-pre)
- Architecture Parmeters and Training
- Experimental Results
- Conclusion

## Intro

기본적인 `domain transfer(style Transfer)`는 source와 target domain(도메인)에 대한 깊은 이해를 요구한다. 이 요구를 만족시키기 위해 도메인에 대한 복잡한 feature(특징)들의 추출이 필요로 하다. 이러한 테스크에 `Variational Autoencoder(AVE)`, `Generative adversarial network(GAN)` 등의 Deep Generative model들이 잘 작동하였다.

음악의 도메인은 장르로 생각 할 수 있다. jazz, pop, rock 등의 음악에서 사용 되는 도메인이라고 할 수 있다. Cover Song이 가장 대표적인 음악에서의 `domain transfer`이다. 유뷰트에서 흔히 볼수 있는 [J.Fla](https://www.youtube.com/channel/UClkRzsdvg7_RKVhwDwiDZOA), [Raon Lee](https://www.youtube.com/channel/UCQn1FqrR2OCjSe6Nl4GlVHw) 같은 아티스트들의 곡이 `domain transfer`된 곡이라고 생각하면 좋을 것 같다. 원곡가가 커버 아티스트가 유사한 장르에 속했다면 기악편성(instrumentation coupled)과 커버 아티스트의 목소리 고유 특징에 조금 변화를 주어도 들을 만한 곡이 된다.

하지만 대부분의 경우 원곡과 커버곡은 다른 스타일을 지향하는 경우가 많다. `Audio domain`이 `image domain`과 가장 다른 점은 이미지의 경우 국지적을로 어색하더라도 전체적인 틀이 괜찮다면 적당히 속이는 것이 가능하다. 하지만 소리의 경우 조금만 어색해도 결과물의 질이 급격하게 하락한다. 사람이 들었을 때 어색하지 않게 하기 위해서는 많고 정교한 노력이 필요로 한다. 3분 내외의 짧은 Rock을 가지고 몇 시간 길이의 교향곡으로 변환시키는 것은 굉장히 많은 노력을 필요로 한다. 본 논문에서 제시하는 `domain transfer`는 이러한 작업을 자동화 하거나 가속화하는 역할을 한다.

Gatys et al<sup>[1](#paper01)</sup>에서 소개 된 것 처럼 `domain transfer`는 이미지의 경우 명식적 특징을 유지하며 다른 이미지의 명시적 특징을 적용한다. 이 특징들은 pre-trained CNN 네트워크 중 `ResNet`에서 추출된 데이터를 사용한다. 전체 도메인에 대한 매핑을 목표로 한다.

보존 될 특징에 대해서 엄격한 explicit한 규칙은 존재 하지 않는다. `Cycle Consistenct Loss`는 내용의 보존을 돕고 도멘인을 바꾸는 것을 도와준다. CycleGAN은 이미지 domain에서 성공적인 퍼포먼스를 보여주었다. CycleGAN은 symbolic 음악의 장르 변화에서도 작동한다. 여기서 말하는 symbolic 음악은 뒤에 자세히 알아보고자 한다. MIDI 파일에 대해 좀 더 알고 싶으면 [이 글](/music/midi)을 참조.

본 논문에서 사용된 모델은 화성음악이 note pitch만을 변경만으로 성공적으로 장르의 변화 즉 `domain transfer`가 발생하는 것을 확인 했다. 추가적인 `Extra Discriminator (EX_D)`를 도입하였는데 이 것은 도메인 전송의 강도와 원래 입력의 내용을 유지하는 것의 균형을 맞추기 위한 것으로 단순히 장르 패턴만을 재생산 해 `D` 를 속이는 것을 방지 하기 위한 `EX_D`이다. 이 부분에 대한 자세한 내용은 [Model Architecture](/paper/3-cyclegan-music-model)파트에서 다룰 것이다.

또 별도의 `classifier`를 도입했는데 네트워크 상에서만 분류 되는 것이 아니라 사람이 듣기에도 음악 같은 음악을 분류하기 위한 장치이다. 이는 앞서 말한 것 같이 `Audio Domain`의 특징에 기인한 것이다.

---

<a id="paper01">1.</a> Image style transfer using convolutional neural networks
