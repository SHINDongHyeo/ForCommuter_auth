# 인증/인가 서버

## 설치 방법

해당 서버는 docker container를 활용해 간단한 명령어만으로 배포할 수 있도록 개발되었습니다.

1. .env.development, .env.production 파일 생성

    도커 컴포즈 파일은 해당 환경 변수 파일에 저장된 값들을 이용하도록 설정되어 있습니다. 개발 환경에 사용할 환경 변수 파일과 배포 환경에 사용할 환경 변수 파일을 생성해주세요. 빈 칸은 각자 채워줍니다.

    ```
    # .env.development 예시
    NODE_PORT=
    DB_HOST=db # 해당 값은 docker-compose.yml 파일에 설정한 데이터베이스 컨테이너명
    DB_PORT=
    DB_USER=
    DB_PASSWORD=
    DB_NAME=

    MYSQL_ROOT_PASSWORD=
    MYSQL_DATABASE=
    MYSQL_USER=
    MYSQL_PASSWORD=
    ```

2. 도커 컴포즈 실행

    실행할 환경(개발 or 배포)에 대한 환경 변수값을 포함해 도커 컴포즈 명령어를 실행합니다. ENVIRONMENT 값은 어떤 이름의 .env 파일을 사용할지 결정하는 변수값입니다. .env.ENVIRONMENT 이름의 환경 변수 파일을 사용하게 되는데요. 즉, 개발 환경일 경우 development, 배포 환경일 경우 production이라고 작성하면 됩니다.

    ```
    # 개발 환경에서 실행 예시
    ENVIRONMENT=development docker-compose up -d
    ```

3. ormconfig.json 생성

    현재 프로젝트는 typeorm을 사용하고 있기에 설정 파일을 생성해줍니다. 빈 칸은 각자 채워줍니다.

    ```
    {
        "type": "mysql",
        "host": "db", # 데이터베이스 컨테이너명으로 설정
        "port": ,
        "username": ,
        "password": ,
        "database": ,
        "logging": true,
        "entities": ["src/auth.entity.ts"]
    }
    ```

4. 어플리케이션 서버 실행

    app이라는 컨테이너명의 도커 컨테이너에 접속한 뒤, nest js 서버를 실행합니다.

    ```
    docekr exec -it app /bin/bash
    npm run start
    ```

    서버가 성공적으로 실행되면 auth.module.ts에서 설정한 TypeOrmModule.forRoot 옵션 중 synchronize: true로 인해 데이터베이스 마이그레이션이 실행됩니다. 데이터베이스 컨테이너에 접속한 뒤 새롭게 생성된 테이블을 확인합니다.

    ```
    docker exec -it db /bin/bash
    mysql -u app_user -p
    비밀번호입력 후
    use forcommuter;
    show tables;
    ```
