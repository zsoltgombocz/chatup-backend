import { User } from "./User";

export interface QueueInterface {
    addToQueue: (userId: string, cb?: Function | undefined) => void,
    removeFromQueue: (userId: string, cb?: Function | undefined) => void,
}

export class Queue implements QueueInterface {
    private static instance: Queue;
    private static queue: string[] = [];

    private constructor() { }

    static getInstance = (): Queue => {
        if (!Queue.instance) {
            Queue.instance = new Queue();
        }

        return Queue.instance;
    }

    addToQueue = (userId: string, cb: Function | undefined = undefined): void => {
        if (Queue.queue.includes(userId)) return;

        Queue.queue.push(userId);

        cb?.();
    }

    removeFromQueue = (userId: string, cb: Function | undefined = undefined): void => {
        if (!Queue.queue.includes(userId)) return;

        const filteredQueue = Queue.queue.filter(id => id !== userId);
        Queue.queue = filteredQueue;

        cb?.();
    }

    static getQueue = (): string[] => Queue.queue;
}