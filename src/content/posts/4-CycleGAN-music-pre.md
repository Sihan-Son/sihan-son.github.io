---
title: Symbolic Music Genre Transfer with CycleGAN(4)
date: "2019-07-04T00:49:14+09:00"
section: paper
slug: 4-CycleGAN-music-pre
thumbnail: /images/thumbnails/4-CycleGAN-music-pre.svg
categories:
  - Paper
  - GAN
tags:
  - gan
  - music
  - CycleGAN
  - genre
  - ML
  - DL
---


# Index

- [Intro](/paper/1-cyclegan-music-intro)
- [Related Work](/paper/2-cyclegan-music-related)
- [Model Architecture](/paper/3-cyclegan-music-model)
- [Dataset and Preprocessing](/paper/4-cyclegan-music-pre)
- Architecture Parmeters and Training
- Experimental Results
- Conclusion

`Model Architecture`파트전에 `Dataset and Preprocessing` 파트를 먼저 다루려고합니다. 이 파트는 `MIDI`대한 간단한 설명과 데이터 전처리 방법과 전략이 나와있는 장입니다. 미디를 다루는 딥러닝 프로젝트에 꽤 큰 도움이 될 듯 합니다.

`MIDI (Musical Instrument Digital Interface)`는 통신 규격을 담은 심볼릭 데이터입니다. 여기에 대한 자세한 설명은 [`Symbolic Music MIDI`](/music/midi)를 참조 해주세요. `MIDI`는 통신 규격이기 때문에 진짜 소리를 가지고 있지 않습니다. `MIDI MSG`를 통해 소프트웨어 또는 하드웨어 `MIDI Synthesizer`로 소리를 만들때 통신을 하게 됩니다. `MIDI MSG`는 많은 정보를 가지고 있지만 전처리에 필요한 것은 `note on`, `note off` 두 메세지입니다.

`note on`은 연주 시작을 의미하며, 음표의 음량을 지정하는 역할을 하게 됩니다. `note off`는 연주의 종료를 의미하고요. 각 음표는 고유의 `pitch` 음의 높낮이를 가지고 있습니다. 0~127의 128단계의 범위를 가지고 있지만 표준 피아노 미디에서는 21~108의 88개 범위에서만 연주합니다. `velocity`는 음량 값인데 `pitch`와 동일하게 0~127의 128 단계의 범위를 갖고 있습니다. `MIDI`는 기본적으로 이렇게 구성이 되어 있고 앞서 이야기 했듯 소리를 만들기 위해서는 소프트웨어나 하드웨어의 `MIDI Synthesizer`가 필요로 하고, 최종 결과물은 사용하는 `Synthesizer`의 종류에 따라 다르게 나옵니다.

`MIDI`는 기본적으로 1차원 형태의 가변적인 `time serise` 데이터입니다. 이런 데이터를 네트워크에 넣기 위해선 `piano-roll`형태의 Matrix로 바꾸는 전처리 과정이 필요합니다. 이 작업을 위해 `pretty_midi`와 `pypianoroll`의 `python` 패키지를 이용합니다. `MIDI`의 `NOTE`는 임의길이를 가지기 때문에 시간에 따라 이산화하여 Matrix로 바꾸기 위해 `sampling`이 필요 합니다. 이 때 `sampling rate`로는 `16 time step sampling rate`를 갖습니다. 그래서 가장 짧은 음이 16가 되게 됩니다.

`t by p Matrix`를 만들게 되는데 t는 `time step`, p는 `pitch`입니다. `time step`은 앞 문단에서 이야기 했든 `16 time step sampling rate`를 가지기 때문에 16이 되고, p는 일반적인 연주 범위인 C1~C8로 잡아 84의 값을 가지게 됩니다. C는 도를 의미하고, 1과 8은 옥타브를 의미합니다. `Velocity` 정보는 학습의 편의성을 위해 의도 적으로 누락시켜 127로 모든 음의 음량을 고정합니다. 음량 정보를 무시하고 오로지 `note on`, `note off`할 수 있도록 하게 합니다. `piano-roll`은 각 시간 단계에서 `p dimensional k hot vector`를 포함하며 k는 동시에 연주되는 음의 수 입니다. `piano-roll`은 마디당 `16 by 84 Matrix`가 되고 훈련 샘플로 4 마디를 연속해 사용해 `64 by 84` 형태의 샘플로 표현 됩니다.

`MIDI`는 다중 트랙을 가질 수 있고, 각 트랙은 다른 악기로 구성 될 수 있습니다. 본 프로젝트는 `Note Pitch`에 기반을 두고 있기 때문에 원곡의 가능한 많은 데이터를 유지 하는 것이 중요합니다. 다음 구절은 해석이 애매해서 논문의 원문으로 기제합니다. `Otherwise, the “style” of the song might be lost after selecting only a subset of voices.`

다른 장르이지만 비슷한 멜로디를 가지고 있는 곡이 있고, 반주에 의해서 곡의 장르가 결정되는 경우도 있는데 이 경우 음표만 고려해서는 분류가 힘듭니다. 다른 연구에선 제한된 `voice`를 택했지만 본 프로젝트는 모든 트랙을 단일 트랙으로 합치는 방법을 택했습니다. 원곡의 정체성을 유지해 원래 노래로 인식 될 수 있도록 하기 위함입니다.

하지만 모든 음이 같은 악기로 연주 되기 때문에 어수선하게 들릴 수 있습니다. 그래서 교향곡 같이 너무 많은 악기나 목소리들이 있는 곡은 택하지 않았습니다. 트랙을 하나로 합칠 때 드럼 트랙은 무시 했는데 다른 악기들과 만찬가지로 오선지에 그리긴 하지만 음의 위치를 표기하는 것이 아니라 쳐야하는 드럼의 종류르 표시 한 것이기 때문에 소리가 좋지 않아 무시합니다.

논문에서 사용한 미디 선정 기준은 다음과 같습니다.

- 시작비트가 0이 아닌 것을 필터링합니다.
- 곡 진행 중 변박이 되는 곡을 필터링 합니다.
- 4/4 박자가 아닌 곡을 필터링 합니다.
