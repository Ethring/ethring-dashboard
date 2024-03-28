import { AxiosResponse } from 'axios';

export interface Response {
    ok: boolean;
    data: any;
    error: string;
}

export interface BaseResponse extends AxiosResponse {
    data: Response;
}
