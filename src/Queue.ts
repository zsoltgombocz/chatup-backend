import { UserStatusEnum } from "./enums";
import { User } from "./User";

export type removeFromQueue = {
    (user: string, cb?: Function | undefined): void;
    (user: User, cb?: Function | undefined): void;
}

export interface QueueInterface {
    addToQueue: (user: User, cb?: Function | undefined) => void,
    removeFromQueue: removeFromQueue,
}
export class Queue implements QueueInterface {
    private static instance: Queue;
    private static queue: User[] = [];

    private constructor() { }

    static getInstance = (): Queue => {
        if (!Queue.instance) {
            Queue.instance = new Queue();
        }

        return Queue.instance;
    }

    static inQueue = (user: User | string): (User | null) => {
        let inQueueUser: User | null;
        if (typeof user === "string") {
            inQueueUser = Queue.queue.filter(u => u.getId() === user)?.[0] || null;
        } else {
            inQueueUser = Queue.queue.filter(u => u.getId() === user.getId())?.[0] || null;
        }

        return inQueueUser;
    }

    addToQueue = (user: User, cb: Function | undefined = undefined): void => {
        if (Queue.inQueue(user) !== null) return;

        Queue.queue.push(user);
        user.setStatus(UserStatusEnum.IN_QUEUE);
        console.log('Added to queue, current: ', Queue.queue.length);

        cb?.();
    };

    removeFromQueue = (user: any, cb: Function | undefined = undefined): void => {
        const inQueueUser: User | null = Queue.inQueue(user);
        if (inQueueUser === null) return;

        const filteredQueue = Queue.queue.filter(u => u.getId() !== inQueueUser.getId());
        Queue.queue = filteredQueue;
        inQueueUser?.setStatus(UserStatusEnum.IDLE);
        console.log('Removed from queue, current: ', Queue.queue.length);
        cb?.();
    }

    searchForPartner = (user: User, onPartnerFound: Function | undefined): any => {
        const queueUsers = Queue.queue.filter(u => u.id !== user.getId())
        const pairableWith = queueUsers.filter((u: User) => user.isPairableWith(u) && u.getRoomId().current === null);

        if (pairableWith.length === 0) return;

        const random = pairableWith[Math.floor(Math.random() * pairableWith.length)];

        onPartnerFound?.(random);
    }

    static getQueue = (): User[] => Queue.queue;
}