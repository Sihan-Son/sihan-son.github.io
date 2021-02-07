---
title: "Symbolic Music Genre Transfer with CycleGAN(2)"
date: 2019-07-01T00:49:14+09:00
tags: ["gan", "music", "CycleGAN", "genre", "ML", "DL"]
categories:
  - paper
  - gan
type: post
---

지난 글에 이어서 이번 글에서는 Related Work 파트의 내용을 정리해려고 합니다. 이번 파트는 선행 연국에 대한 이야기이기 때문에 레펀러스가 많이 달리고 논문 링크는 하단에 레퍼런스로 있습니다

# Index

- [Intro](/paper/1-cyclegan-music-intro)
- [Related Work](/paper/2-cyclegan-music-related)
- [Model Architecture](/paper/3-cyclegan-music-model)
- [Dataset and Preprocessing](/paper/4-cyclegan-music-pre)
- Architecture Parmeters and Training
- Experimental Results
- Conclusion

## Related Work

Gatys et al.<sup><a href="#paper01">1</a></sup>
의 논문에서 `Neural Style Transfer`의 컨셉을 설명한다. 이 논문에서는 Pre-Trained CNN `ResNet`을 이용해 두 이미지의 스타일과 컨텐츠를 합친다.

`CycleGAN`<sup><a href="#paper02">2</a></sup>같은 접근에서는 explict 스타일 특성 추출이 요구되지 않는다. 대신 pair의 `Generator (G)`가 사용된다. 이 두 개의 `G`는 데이터의 `domain transfer`를 위해 사용이 된다. 두 도메인의 특성은 추출될 특징의 종률르 implicit 한다. A 도메인이 사진이고 B가 그림이라고 한다면 `CycleGAN`은 사진을 그림으로 바꾸고, 그림을 사진으로 바꾸는 양 방향으로 작동한다. `MIDI` 파일을 이미지와 같은 방법으로 `CycleGAN`이 사용 가능하다. `CycleGAN`은 `CycleGAN-VC`, `StarGAN`, `DualGAN` 등으로 발전했다. `music domain transfer`에서 좀 더 발전된 복잡한 네트워크를 도입하기 기대하지만 해당 프로젝트에서는 시도하지 않고 `CycleGAN`을 사용한다

Malik et al.<sup><a href='#paper03'>3</a></sup>의 논문은 기존 `music domain transfer`연구에 대한 내용이 담겨 있다. 사람의 연주에서 연주 스타일을 배우는 모델을 소개한다. Flat한 `MIDI`에 `Velocities(음의 강약)`를 추가해 실제적은 소리로 만들어 낸다. 단순히 `Note Velocities`를 변화 시킴으로 다른 음악가의 스타일이나 장르에 대한 학습 없이 정말 사람처러 연주를 한다

Brunner et al.<sup><a href='#paper04'>4</a></sup>의 논문에서는 `MIDI-VAE` 다중작업 `VAE`모데을 소개한다. 이 모델은 [`latent space`](MLDL/latent-space)를 공유한다. 스타일의 구성요소를 완벽하게 바꿀수 있는 네트워크 모델이다. 즉 `MIDI-VAE`는 `Note pitch` 외에도 `MIDI` 파일에 포함된 음악의 대부분의 다른 측명, `Velocity`, `Duration` 및 `기악 instumentation`을 모델링한다. `MIDI-VAE`는 재생되는 음의 수를 제한하는 반면 해당 논문은 음의 수를 제한하지 않아 더 풍부한 음향을 불러온다. 또 `Note pitch`에만 집중하면 되기 때문에 편한 모델이다.

Van den Oord et al.<sup><a href='#paper05'>5</a></sup>의 논문에서는 `Raw Audio VAE`모델을 이야기 한다. `Latent space`에서 speaker의 `voice transfer`가 가능하다.

Mor et al.<sup><a href='#paper06'>6</a></sup>에서는 WaveNet을 기반으로 한 네트워크를 소개한다. AutoEncoder는 악기, 장르 스타일 간의 raw 음악을 translate 가능하다. 심지어 휘파람에서 음악을 synthesis가 가능하다.

Roberts et al.<sup><a href='#paper07'>7</a></sup>에서 소개된 모델은 `lecome MusicVAE`는 폴리포닉(동시에 여러 음 연주) 음악에서 장기적 구조를 포착할 수 있고 높은 보간과 재구성을 보여줄 수 있는 계층적 `VAE` 모델이다. `GAN`은 매우 강력하지만, 훈련하기가 어렵기때문에 일반적으로 순차 데이터에 적용되지 않는다.

Mogren<sup><a href='#paper08'>8</a></sup>, Yang et al.<sup><a href='#paper09'>9</a></sup> and Dong et al.<sup><a href='#paper10'>10</a></sup>에서 `CNN`기반의 `GAN` 작곡의 효과를 보여줌

음악은 듣을 때 이상하지 않아야 성공이다. 스타일이나 도메인 전송에 직접 적용하지 않고 자동 음악 생성 분야에서 중요한 작업을 간단히 다룰 것이다. 대부분 `Standard RNN` 이나 `LSTM`모델을 사용한다. 최근 연구에서는 `CNN`에서도 성공적으로 사용되었고, `RNN`과 결합되기도 한다. `VAE(Variational Autoencoder)`와 `GAN(Generative Adversacy Networks)`은 점점 성공적으로 나아간다

---

<a id="paper01">1.</a> Image style transfer using convolutional neural networks  
<a id="paper02">2.</a> Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks  
<a id="paper03">3.</a> Neural translation of musical style  
<a id="paper04">4.</a> MIDI-VAE: Modeling dynamics and instrumentation of music with applications to style transfer  
<a id="paper05">5.</a> Neural discrete representation learning  
<a id="paper06">6.</a> A universal music translation network  
<a id="paper07">7.</a> Hierarchical variational autoencoders for music  
<a id="paper08">8.</a> C-RNN-GAN: continuous recurrent neural networks with adversarial training  
<a id="paper09">9.</a> MidiNet: A convolutional generative adversarial network for symbolic-domain music generation  
<a id="paper10">10.</a>MuseGAN: Multi- track sequential generative adversarial networks for symbolic music generation and accompaniment
