export enum Provider {
    Google = 'google',
    Kakao = 'kakao',
    Apple = 'apple',
}

export interface GoogleLogInResponse {
    jwt: string;
    userInfo: {
        nick: string,
    };
}