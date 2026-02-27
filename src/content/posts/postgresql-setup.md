---
title: PostgreSQL 세팅과 계정 관리
date: 2026-02-27
section: setting
slug: postgresql-setup
thumbnail: /images/thumbnails/postgresql-setup.svg
categories:
  - Setting
tags:
  - postgresql
  - database
  - linux
  - ubuntu
---

우분투 서버에 PostgreSQL을 올리고, 데이터베이스와 계정을 만드는 과정을 정리했다. 매번 `CREATE USER` 문법을 검색하게 되는데, 한번 정리해두면 편하다.

## 설치

우분투 기본 리포지토리에도 PostgreSQL이 있지만, 최신 버전을 쓰려면 공식 리포지토리를 추가하는 게 낫다.

공식 리포지토리 등록:

```bash
sudo apt install -y gnupg2 lsb-release
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list
```

설치:

```bash
sudo apt update
sudo apt install -y postgresql-17
```

버전 번호는 필요에 맞게 바꾸면 된다. 이 글 작성 시점 기준 최신 안정 버전은 17이다.

설치가 끝나면 PostgreSQL 서비스가 자동으로 시작된다. 확인:

```bash
sudo systemctl status postgresql
```

`active (exited)`로 나오면 정상이다. 실제 프로세스는 클러스터 단위로 관리되기 때문에 `exited`가 맞다.

## 부팅 시 자동 시작

보통 설치하면 자동 등록되지만, 확인 겸:

```bash
sudo systemctl enable postgresql
```

## psql 접속

PostgreSQL은 설치 시 `postgres`라는 시스템 유저와 동일한 이름의 DB 슈퍼유저를 만든다. 처음 접속은 이 계정으로 한다.

```bash
sudo -u postgres psql
```

`postgres=#` 프롬프트가 뜨면 성공이다. 나가려면 `\q`를 입력한다.

## 계정(Role) 만들기

PostgreSQL에서는 유저와 그룹을 통칭해서 **Role**이라고 부른다. `CREATE USER`는 `CREATE ROLE ... WITH LOGIN`의 줄임이다.

### 기본 계정 생성

```sql
CREATE USER myapp WITH PASSWORD 'strong_password_here';
```

이렇게 만들면 로그인은 가능하지만 데이터베이스를 만들거나 다른 유저를 관리하는 권한은 없다. 애플리케이션용 계정은 이 정도면 충분하다.

### 권한 옵션

필요에 따라 옵션을 추가할 수 있다.

```sql
-- DB 생성 권한
CREATE USER devuser WITH PASSWORD 'dev_pass' CREATEDB;

-- 슈퍼유저 (운영에서는 쓰지 말 것)
CREATE USER admin WITH PASSWORD 'admin_pass' SUPERUSER;
```

| 옵션 | 설명 |
|------|------|
| `LOGIN` | 로그인 가능 (CREATE USER의 기본값) |
| `CREATEDB` | 데이터베이스 생성 가능 |
| `CREATEROLE` | 다른 Role 생성 가능 |
| `SUPERUSER` | 모든 권한 (위험) |
| `REPLICATION` | 복제 연결 가능 |

운영 환경에서 `SUPERUSER`는 절대 애플리케이션 계정에 주면 안 된다. 최소 권한 원칙을 지키자.

### 기존 계정 권한 변경

```sql
ALTER USER myapp CREATEDB;
ALTER USER myapp WITH PASSWORD 'new_password';
```

### 계정 목록 확인

```sql
\du
```

모든 Role과 권한을 한눈에 볼 수 있다.

## 데이터베이스 만들기

```sql
CREATE DATABASE myapp_db OWNER myapp;
```

`OWNER`를 지정하면 해당 유저가 DB의 모든 객체를 관리할 수 있다. 따로 `GRANT`를 줄 필요가 없어서 편하다.

DB 목록 확인:

```sql
\l
```

## 특정 DB에 권한 부여

이미 있는 DB에 다른 계정의 접근 권한을 줄 때:

```sql
GRANT CONNECT ON DATABASE myapp_db TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

이후에 새로 만들어지는 테이블에도 자동으로 권한을 주려면:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

이걸 빼먹으면 테이블을 새로 만들 때마다 `GRANT`를 다시 해줘야 하는데, 한참 뒤에 "permission denied" 보고 당황하게 된다.

## 외부 접속 허용

기본 설치 상태에서는 로컬에서만 접속할 수 있다. 외부에서 접속하려면 두 파일을 수정해야 한다.

설정 파일 위치 확인:

```bash
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"
```

보통 `/etc/postgresql/17/main/` 아래에 있다.

### postgresql.conf

```bash
sudo vi /etc/postgresql/17/main/postgresql.conf
```

`listen_addresses`를 찾아서 수정:

```
listen_addresses = '*'
```

기본값이 `localhost`라 외부 요청을 아예 안 받는다. `'*'`로 바꾸면 모든 인터페이스에서 리슨한다. 특정 IP만 받고 싶으면 `'192.168.1.10,10.0.0.5'`처럼 콤마로 나열할 수 있다.

### pg_hba.conf

```bash
sudo vi /etc/postgresql/17/main/pg_hba.conf
```

파일 끝에 추가:

```
# 특정 서브넷만 허용
host    myapp_db    myapp    10.0.0.0/24    scram-sha-256

# 모든 IP 허용 (개발용, 운영에서는 비추)
# host    all    all    0.0.0.0/0    scram-sha-256
```

`md5` 대신 `scram-sha-256`을 쓰는 게 더 안전하다. PostgreSQL 10부터 지원한다.

설정 반영:

```bash
sudo systemctl restart postgresql
```

접속 테스트:

```bash
psql -h 서버IP -U myapp -d myapp_db
```

## 자주 쓰는 psql 명령어

| 명령어 | 설명 |
|--------|------|
| `\l` | 데이터베이스 목록 |
| `\du` | Role(계정) 목록 |
| `\dt` | 현재 DB의 테이블 목록 |
| `\d 테이블명` | 테이블 구조 확인 |
| `\c DB명` | 다른 DB로 전환 |
| `\q` | psql 종료 |
| `\x` | 확장 출력 토글 (세로로 보기) |

## 계정 삭제

```sql
-- 계정이 소유한 객체가 없을 때
DROP USER readonly_user;

-- 소유한 객체가 있으면 먼저 재할당
REASSIGN OWNED BY old_user TO postgres;
DROP OWNED BY old_user;
DROP USER old_user;
```

`DROP USER`가 실패하면 대부분 해당 유저가 소유한 객체가 남아있어서 그렇다. `REASSIGN OWNED BY`로 소유권을 옮기고 `DROP OWNED BY`로 권한을 정리한 뒤 삭제하면 된다.

## Docker로 세팅하기

서버에 직접 설치하지 않고 Docker로 PostgreSQL을 띄울 수도 있다. 로컬 개발 환경이나 테스트용으로 특히 편하다.

### compose.yml

```yaml
services:
  db:
    image: postgres:17
    container_name: myapp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: strong_password_here
      POSTGRES_DB: myapp_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d

volumes:
  pgdata:
```

핵심 포인트:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` 환경 변수로 초기 계정과 DB가 자동 생성된다
- `pgdata` named volume으로 컨테이너를 삭제해도 데이터가 유지된다
- `ports`로 호스트의 5432 포트를 컨테이너에 매핑한다

실행:

```bash
docker compose up -d
```

### 컨테이너 접속

```bash
docker exec -it myapp-postgres psql -U myapp -d myapp_db
```

호스트에서 직접 접속하려면:

```bash
psql -h localhost -U myapp -d myapp_db
```

### 초기화 스크립트

`/docker-entrypoint-initdb.d/` 디렉토리에 `.sql` 또는 `.sh` 파일을 넣으면 컨테이너가 **처음 생성될 때** 자동 실행된다. 이미 데이터가 있는 볼륨이면 실행되지 않는다.

예를 들어 `init/01-setup.sql`을 만들어두면:

```sql
-- init/01-setup.sql
CREATE USER readonly_user WITH PASSWORD 'readonly_pass';
GRANT CONNECT ON DATABASE myapp_db TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

파일 이름 순서대로 실행되므로, 번호를 붙여서 순서를 제어할 수 있다.

### 볼륨 관리

```bash
# 데이터 포함 완전 삭제
docker compose down -v

# 컨테이너만 삭제 (데이터 유지)
docker compose down
```

`-v` 플래그를 붙이면 named volume까지 삭제된다. 데이터를 날리고 초기화 스크립트부터 다시 실행하고 싶을 때 쓴다.

## 정리

전체 과정을 한 스크립트로 정리하면:

**직접 설치 (우분투):**

```bash
# PostgreSQL 공식 리포지토리 등록 및 설치
sudo apt install -y gnupg2 lsb-release
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-17

# DB와 계정 생성
sudo -u postgres psql <<'SQL'
CREATE USER myapp WITH PASSWORD 'strong_password_here';
CREATE DATABASE myapp_db OWNER myapp;
SQL

# 확인
sudo -u postgres psql -c "\du"
sudo -u postgres psql -c "\l"
```

**Docker:**

```bash
# compose.yml이 있는 디렉토리에서
docker compose up -d

# 접속
docker exec -it myapp-postgres psql -U myapp -d myapp_db
```

외부 접속이 필요하면 직접 설치의 경우 `postgresql.conf`와 `pg_hba.conf` 수정을 잊지 말자. Docker의 경우 `ports` 매핑으로 이미 외부 접속이 가능하다.
