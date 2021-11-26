import axios from 'axios';
import {
    GetIslandResponse,
    GetIslandsPayload,
    GetIslandsResponse,
    GetQueueStatusResponse,
    GrabCodeResponse,
    JoinIslandQueueResponse,
} from './types';

export const getIslands = (payload: GetIslandsPayload) =>
    axios.post<GetIslandsResponse>(
        'https://api.turnip.exchange/islands/',
        payload
    );

export const joinIslandQueue = (id: string, visitorId: string, name: string) =>
    axios.put<JoinIslandQueueResponse>(
        `https://api.turnip.exchange/island/queue/${id}?visitorID=${visitorId}`,
        { name },
        {
            headers: {
                'x-recaptcha-token': visitorId,
            },
        }
    );

export const getQueueStatus = (id: string, visitorId: string) =>
    axios.post<GetQueueStatusResponse>(
        `https://api.turnip.exchange/island/queue/${id}?visitorID=${visitorId}`
    );

export const grabCode = (id: string, visitorId: string) =>
    axios.post<GrabCodeResponse>(
        `https://api.turnip.exchange/island/queue/${id}/grab?visitorID=${visitorId}`
    );

export const getIsland = (id: string) =>
    axios.post<GetIslandResponse>(`https://api.turnip.exchange/island/${id}`);
