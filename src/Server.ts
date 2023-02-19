import { Server } from 'socket.io';
import { Queue } from './Queue';
import { User, UserDataInterface } from './User';

import { v4 as uuidv4 } from 'uuid';
import { isValidToken } from './utils/isValidToken';

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
        let user = new User(token, client, () => this.queue.removeFromQueue(token));
        this.listenUserInteraction(user, client);
        client.emit('userAuthDone', token);

        this.addToConnectedUsers(user);

        this.queue.addToQueue(user, () => {
            client.emit('addedToQueue', 'nyehehe');
        });
    }

    listenUserInteraction = (user, client): void => {
        client.on('updateData', (data: UserDataInterface) => user.updateUserData(data));
        client.on('cancelSearch', () => this.queue.removeFromQueue(user));
    }
}