---
type: post
title: "윈도우에서 Jekyll 서버 실행하기"
date: 2019-07-11
tags:
  - blog
  - jekyll
  - github
  - ruby
categories:
  - Setting
---

오늘은 `Github page`로 블로그 중에서 `Jekyll` 기반 블로그를 이용하는 이용자에게 push 하지 않고 로컬머신에서 확인하는 방법을 소개하려고 합니다. `Mac`, `Linux` 사용자에겐 상대적으로 수월 하지만 윈도우에서는 번거러운 점이 좀 있어서 시도해보다가 그만둔 사용자가 있을 겁니다. 제가 그 중 하나였으니까요. 그래서 `Ruby` 설치 부터 로컬 머신 실행까지 절차를 알아보려고 합니다!

# 루비 Ruby 설치

`Jekyll`은 `Ruby`로 만들어 졌기 때문에 먼저 `Ruby`를 설치해야합니다. [Ruby installer for Window](https://rubyinstaller.org/downloads/)에서 `Ruby+Devkit` 파일을 다운로드 받으셔서 설치하면 됩니다. 이 과정에서 환경변수(PATH)까지 잡히게 됩니다

# Jekyll 설치하기

`Ruby`를 설치했으면 이제 `Jekyll`을 설치해야합니다. 먼저 윈도우 버튼을 누른 후 `Prompt with Ruby`를 검색해 주세요. 그리고 나오는 것 중에서 `Start Command Prompt with Ruby`를 실행 시키면 됩니다.  
Prompt에서 `gem`명령어를 이용해 필요한 패키지들을 설치해 줍니다.

<pre><code>gem install jekyll
gem install minima
gem install bundler
gem install jekyll-feed
gem install tzinfo-data
</code></pre>

`gem`명령어를 이용한 패키지 설치가 끝났으면 `bundle`을 이용한 추가 패키지 설치가 필요합니다. 우선 Prompt에서 사용하고 있는 블로그의 `repo`로 이동합니다. 해당 `repo`에서 `bundle`명령을 실행 시킵니다.

<pre><code>bundle install</code></pre>

이제 기본적인 모든 준비가 끝났습니다!

# 로컬 머신 활성화

이제 앞 단계에서 온 블로그의 `repo`에서 다음 명령어를 실행시켜줍니다.

<pre><code>bundle exec jekyll serve</code></pre>

![bundle](/images/blog/bundle_exec.png)

같은 화면이 뜨면서 이제 `http://127.0.0.1:4000`에서 블로그 글을 서버에 업로드 하기 전에 확인할 수 있게 되었습니다!
