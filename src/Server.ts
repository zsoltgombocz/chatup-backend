import { Server } from 'socket.io';
import { Queue } from './Queue';
import { User } from './User';

import { v4 as uuidv4 } from 'uuid';
import { isValidToken } from './utils/isValidToken';

export interface ServerInterface {
    server: any,
    connectedUsers: User[],
    onConnect(client): void,
    addToConnectedUsers(user: User): void,
    removeFromConnectedUsers(id: string): void,
}

export class SocketServer implements ServerInterface {
    server = null;
    queue = Queue.getInstance();
    connectedUsers = [];

    constructor(http: any) {
        this.server = new Server(http, {
            cors: {
                origin: process.env.ENV === 'development' ? '*' : process.env.TRUSTED_ORIGIN
            }
        });

        this.server.on('connection', this.onConnect);
    }

    addToConnectedUsers = (user: User): void => {
        const exists = this.connectedUsers.find(connectedUser => connectedUser.id === user.getId());

        if (!exists) this.connectedUsers.push(user);

        this.server.emit('usersChanged', this.connectedUsers.length);
    }

    removeFromConnectedUsers = (id: string): void => {
        const filteredConnectedUsers = this.connectedUsers.filter((connectedUser: User) => connectedUser.getId() !== id);

        this.connectedUsers = filteredConnectedUsers;

        this.server.emit('usersChanged', this.connectedUsers.length);
    }

    getAuthToken = (socket: any): string | null => {
        const token: string | undefined = socket.handshake.auth?.token;

        return isValidToken(token) ? token : undefined;
    }

    onConnect = (client): void => {
        const token: string | undefined = this.getAuthToken(client) || uuidv4();
        let user = new User(token, client, () => this.removeFromConnectedUsers(token));
        client.emit('userAuthDone', token);
        console.log('connect', token)
        this.addToConnectedUsers(user);

        /*this.queue.addToQueue(user.getId(), () => {
            client.emit('addedToQueue', 'nyehehe');
            user.setStatus(UserStatusEnum.IN_QUEUE);
        });*/
    }
}