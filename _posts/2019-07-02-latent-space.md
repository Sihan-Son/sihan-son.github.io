---
layout: post
title:  "Simple Latent Space"
date:   2019-07-01
excerpt: "What is latent space"
sitemap :
  changefreq : daily
  priority : 1.0
tag:
- GAN
- graduation
- ML
comments: true
---

오늘은 `Generative adversarial network GAN` 논문을 읽거나 자료를 접하다보면 자주 보는 `latent space`에 대한 자료를 포스팅 하려고 합니다. 이 포스트는 아마도 지속적으로 업데이트가 진행되면서 내용이 풍부해지길 저도 기대하고 있습니다. 이 포스팅은 `latent space`에 대해서 간단하게 알아보는 포스팅이니 개념만 잡고 가세요. 혹시 잘못된 내용이 있다면 메일이나 댓글로 피드백 주시면 수정하도록 하겠습니다!  

머신러닝의 성능은 데이터의 양과 질에 굉장히 의존적입니다. `Trash in Trash out` 말이 있듯이 데이터의 질에 성능이 심히 요동치게 됩니다.  

그래서 데이터가 모이면 어떤 `feature`가 유용한지 아닌지 확인하는 작업이 필요로 합니다. `feature`가 많으면 좋긴 하지만 공간의 복잡도가 올라가기 때문에 `차원의 저주`에 빠지게 됩니다. `차원의 저주`는 다음에 기회가 되면 다뤄 보도록 하겠습니다.  

유용한 `feature`를 확인하는 과정을 `feature selection`, `feature extraction`이라고 합니다. 이러한 기법을 거쳐서 대상을 잘 기술 할 수 있는 `feature`들의 분포 공간을 `latent space`라고 합니다. 관찰된 공간을 `observation space`라고 하는데 `latent space`는 `observation space`보다 작을 수 있습니다.  

`observation space` 위의 샘플들을 기반으로 `latent space`를 파악하는 것을 `dimensionality reduction technique(차원축소)`이라고 하고 앞 문단에서 이야기한 과정을 거치게 됩니다. `차원축소`를 하게 되면 데이터 압축이나 노이즈 제거 효과가 발생하게 됩니다. 하지만 이것이 `차원축소`의 본질적인 목적이 아니고 부수적으로 발생하는 효과입니다. `차원축소`의 목적은 관측된 데이터를 잘 기술할 수 있는 특징을 찾는 것 입니다. 즉 `차원축소`의 가장 큰 의의는 `latent space`를 찾는 것 입니다.  

`GAN`에서는 `input space(z)`가 `latent space`로 기술 됩니다. `Latent Space Walking`이라는 것도 있는데 이것은 `z`가 잠재변수로 의미를 가지려면 `z`가 살고 있는 공간이 움지였을 때 의미론적으로 smooth한 결과를 도출해야 한다는 것을 의미합니다. 이 부분에 대한 자세한 내용은 `DCGAN` 논문을 참조 해주세요. 아니면 언젠가 포스팅 될지도 모르는 글을 기다려주세요....