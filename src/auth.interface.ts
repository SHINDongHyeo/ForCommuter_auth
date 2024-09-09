export enum Provider {
    Google = 'google',
    Kakao = 'kakao',
}

export interface LogInResponse {
    jwt: string;
    userInfo: {
        nick: string,
    };
}

export interface SignUpResponse {
    jwt: string;
    userInfo: {
        nick: string,
    };
}

export interface KakaoPayload {
    id: string;
    connected_at: Date;
    kakao_account: KakaoAccount;
}

export interface KakaoAccount {
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
}
