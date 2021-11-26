import { IslandCategory, IslandIslander } from './constants';

export type GetIslandsPayload = {
    islander: IslandIslander;
    category: IslandCategory;
};

export type Island = {
    turnipCode: string;
    name: string;
    fruit: string;
    turnipPrice: number;
    maxQueue: number;
    queued: string;
    discordOnly: number;
    visitorCount?: number;
    visitorLimit?: number;
};

export type GetIslandsResponse = {
    success: boolean;
    islands: Island[];
};

export type JoinIslandQueueResponse = {
    success: boolean;
    message: string;
    $id: number;
    yourPlace: number;
    maxQueue: number;
    currentQueueSize: number;
    timestamp: number;
};

export type GetQueueStatusResponse = {
    success: boolean;
    total: number;
    yourPlace: number;
};

export type GrabCodeResponse = {
    success: boolean;
    message: string;
    dodoCode: string;
};

export type GetIslandResponse = {
    success: boolean;
    islandInfo: Island;
};
