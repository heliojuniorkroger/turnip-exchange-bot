import axios from 'axios';
import type {
  GetIslandResponse,
  GetIslandsPayload,
  GetIslandsResponse,
  GetQueueStatusResponse,
  GrabCodeResponse,
  JoinIslandQueueResponse,
} from './types';

export const apiURL = 'https://api.turnip.exchange';

export const getIslands = (payload: GetIslandsPayload) =>
  axios.post<GetIslandsResponse>(`${apiURL}/islands/`, payload);

export const joinIslandQueue = (id: string, visitorId: string, name: string) =>
  axios.put<JoinIslandQueueResponse>(
    `${apiURL}/island/queue/${id}?visitorID=${visitorId}`,
    { name },
    {
      headers: {
        'x-recaptcha-token': visitorId,
      },
    }
  );

export const getQueueStatus = (id: string, visitorId: string) =>
  axios.post<GetQueueStatusResponse>(
    `${apiURL}/island/queue/${id}?visitorID=${visitorId}`
  );

export const grabCode = (id: string, visitorId: string) =>
  axios.post<GrabCodeResponse>(
    `${apiURL}/island/queue/${id}/grab?visitorID=${visitorId}`
  );

export const getIsland = (id: string) =>
  axios.post<GetIslandResponse>(`${apiURL}/island/${id}`);
