import { Server } from 'socket.io';
import { Queue } from './Queue';
import { User, UserDataInterface } from './User';

import { v4 as uuidv4 } from 'uuid';
import { isValidToken } from './utils/isValidToken';
import { UserStatusEnum } from './enums';

import { CronJob } from 'cron';

export interface ServerInterface {
    server: any,
    connectedUsers: User[],
    onConnect(client): void,
    addToConnectedUsers(user: User): void,
    removeFromConnectedUsers(id: string): void,
    listenUserInteraction(user: User, client): void,
}

export class SocketServer implements ServerInterface {
    server = null;
    queue = Queue.getInstance();
    connectedUsers = [];
    #inactiveUserCleanup: CronJob;

    constructor(http: any) {
        this.server = new Server(http, {
            cors: {
                origin: "https://socket-admin.chatup.hu:*",
                methods: ["GET", "POST"],
            }
        });

        this.server.on('connection', this.onConnect);
        this.#startInactiveUserCleanupJob();
    }

    #startInactiveUserCleanupJob = (minutes: number = 5): void => {
        this.#inactiveUserCleanup = new CronJob(`*/${minutes} * * * *`, async () => {
            try {
                this.#deleteDisconnectedUsers(15);
            } catch (e) {
                console.error(e);
            }
        });

        if (!this.#inactiveUserCleanup.running) {
            this.#inactiveUserCleanup.start();
        }
    }

    //? Filters out the connected users based on passed minutes
    //? If the user disconnected and on cronjob run he/she/it reached the 'minutes'
    //? variable (def.: 5 minutes), will be filtered out a.k.a delete the whole User object => no recovering
    #deleteDisconnectedUsers = (minutes: number = 5): void => {
        console.log('Inactive user cleanup:');
        if (this.connectedUsers.length === 0) return console.log('No cleanup need, users = 0');

        const expiredUserList = this.connectedUsers.filter((user: User) => {
            if (user.getCurrentStatus() !== UserStatusEnum.DISCONNECTED) return false;

            const elapsedTimeInMinutes = Math.floor((Date.now() - user.getTime().leave) / 60000);

            return elapsedTimeInMinutes >= minutes;
        });

        expiredUserList.forEach((user: User) => this.removeFromConnectedUsers(user.id));
    }

    addToConnectedUsers = (user: User): void => {
        const exists = this.connectedUsers.find(connectedUser => connectedUser.id === user.getId());

        if (!exists) this.connectedUsers.push(user);

        console.log('Connected user, current: ' + this.connectedUsers.length);
        this.server.emit('userNumberChanged', this.connectedUsers.length);
    }

    removeFromConnectedUsers = (id: string): void => {
        const filteredConnectedUsers = this.connectedUsers.filter((connectedUser: User) => connectedUser.getId() !== id);

        this.connectedUsers = filteredConnectedUsers;
        console.log('Disconnected user, current: ' + this.connectedUsers.length);
        this.server.emit('userNumberChanged', this.connectedUsers.length);
    }

    getAuthToken = (socket: any): string | null => {
        const token: string | undefined = socket.handshake.auth?.token;

        return isValidToken(token) ? token : undefined;
    }

    onConnect = (client): void => {
        const token: string | undefined = this.getAuthToken(client) || uuidv4();
        let user = new User(token, client);
        this.listenUserInteraction(user, client);
        client.emit('userAuthDone', token);
        console.log(Date.now());

        this.addToConnectedUsers(user);
    }

    listenUserInteraction = (user: User, client): void => {
        client.on('updateData', (data: UserDataInterface) => user.updateUserData(data));
        client.on('startSearch', () => this.queue.addToQueue(user));
        client.on('cancelSearch', () => this.queue.removeFromQueue(user));
        client.on("disconnect", (reason) => {
            user.disconnect(Date.now(), reason);
            this.queue.removeFromQueue(user.getId());
        });
    }
}