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

    static establishConnection = (host: string, port: number, password: string): void => {

        if (RedisServer.instance) return;

        const client = new Redis({ host, port, password, retryStrategy: null });

        client.on('connect', () => {
            console.log('Connected to Redis!');
        });

        client.on('error', (err) => {
            console.log('Error connecting to Redis:', err);
        });

        RedisServer.instance = client;
    }
}