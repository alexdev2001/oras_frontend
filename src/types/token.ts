export interface DecodedToken {
    user_id: number;
    operator_id: number;
    email: string;
    roles: string[];
    exp: number;
    iat: number;
}
