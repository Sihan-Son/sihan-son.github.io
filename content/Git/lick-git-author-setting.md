---
type: post
title: "겉핥기로 시작하는 Git -Setting편-"
date: 2021-02-16T00:00:50+09:00
categories:
  - Git
tags:
  - Git
  - lick
  - setting
---

`commit`은 한 번 밀리게 되었습니다. 생각을 해보니까 이걸 안해놓으면 나중에 `commit`할 때 꼬일거 같아서 설정을 먼저 해보겠습니다.

`add`한 파일의 변경사항을 기록하는게 `commit`입니다. 게임도 저장할때 누구의 세이브 파일인지 알려줍니다. `Git`도 비슷하게 누가 해당 `commit`을 남기는지 알고 싶어합니다. `Git`이 원하느 정보는 두 가지입니다. 당신의 이름이 뭐고, 연락하고 싶을 때 보낼 메일 주소입니다.

```git
git config --global user.name "Hong-Gildong"
git config --global user.email "gildong@github.com"
```

이 명령어는 내 컴퓨터고 나 혼자 이 컴퓨터에서 `Git`을 사용한다! 하시는 분에게 추천합니다. `--global`에서 감을 잡으셨겠지만 전역 설정하는 방법입니다. 여러분은 ""사이에 있는 `Hong-Gildong`과 `gildong@github.com`만 여러분의 이름과 메일 주소로 바꿔 주면 됩니다. 설정 된 이름은 `log`에서 `Author`에 표시됩니다.
~~서버에서 작업하실 분이 이글을 읽을 것 같지는 않지만.. 혹시 계시다면 `docker`에서 쓰세요...~~

![log](/images/git/setting/author.png)

이건 제가 설명을 위해서 사용중 이름과 메일 주소인데 이런식으로 여러분의 메일과 이름이 `log`에 남게 됩니다. 이런 방법 말고도 설정된 이름과 주소를 볼 수 있습니다.

```git
git confign --list
```

명령어를 입력하면 나는 설정한 적도 없는 내용들이 쭉 나타나게 됩니다. 여기서 글자색이나 편집기도 수정 할 수 있지만 설정 파일을 만지는건 `Git`에 어느 정도 익숙해진 다음으로 미루기로 합시다.

```git
git config --local user.name "Hong-Gildong"
git config --local user.email "gildong@github.com"
```

이름과 메일을 전역 설정을 했지만 이번 프로젝트에서만 부캐로 기록을 남기고 싶을 수도 있잖아요? 그럴 때 사용하는 방법입니다. 전역설정과 차이점은 `--global` => `--local`이 다 입니다. 하지만 여기서 설정한 이름과 메일은 해당 `Working Directory`에서만 유효합니다.

다음 글은 정말로 `commit`으로 돌아올게요.

---

`겉핥기로 시작하는 Git` 시리즈는 `Git bash`를 사용하는 것으로 전제로 작성 된 글입니다. 이김에 `CLI`에 익숙해져 보세요!!
