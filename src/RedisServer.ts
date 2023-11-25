import Redis from 'ioredis';



export interface RedisInterface {

}

export class RedisServer implements RedisInterface {
    private static instance: Redis;

    private constructor() { }

    static getInstance = (): Redis => {
        if (!RedisServer.instance) {
            return null;
        }

        return RedisServer.instance;
    }

    static establishConnection = (url: string): void => {

        if (RedisServer.instance) return;

        const client = new Redis(url);

        RedisServer.instance = client;
    }
}