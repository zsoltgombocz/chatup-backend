import { Server } from 'socket.io';
import { Queue } from './Queue';
import { User, UserDataInterface } from './User';

import { v4 as uuidv4 } from 'uuid';
import { isValidToken } from './utils/isValidToken';
import { UserStatusEnum } from './enums';

import { CronJob } from 'cron';
import { Room } from './Room';

export interface ServerInterface {
    server: any,
    connectedUsers: User[],
    onConnect(client): void,
    addToConnectedUsers(user: User): void,
    removeFromConnectedUsers(id: string): void,
    listenUserInteraction(user: User, client): void,
    recoverUser(token: string): User | undefined
}

export class SocketServer implements ServerInterface {
    server = null;
    queue = Queue.getInstance();
    connectedUsers = [];
    #cleanup: CronJob;

    constructor(http: any) {
        this.server = new Server(http, {
            cors: {
                origin: process.env.ENV === 'development' ? '*' : [process.env.ADMIN_ORIGIN, process.env.FRONTEND_ORIGIN],
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.server.on('connection', this.onConnect);
        const enabledCleanup = parseInt(process.env.ENABLE_CLEANUP) || 0;
        if (enabledCleanup) this.#startCleanup(2);
    }

    #startCleanup = (minutes: number = 5): void => {
        this.#cleanup = new CronJob(`*/${minutes} * * * *`, async () => {
            try {
                this.#deleteDisconnectedUsers(1);
                Room.deleteEmptyRooms();
            } catch (e) {
                console.error(e);
            }
        });

        if (!this.#cleanup.running) {
            this.#cleanup.start();
        }
    }

    //? Filters out the connected users based on passed minutes
    //? If the user disconnected and on cronjob run he/she/it reached the 'minutes'
    //? variable (def.: 5 minutes), will be filtered out a.k.a delete the whole User object => no recovering
    #deleteDisconnectedUsers = (minutes: number = 5): void => {
        if (this.connectedUsers.length === 0) return console.log('No user deleted because no user connected!');

        const expiredUserList = this.connectedUsers.filter((user: User) => {
            if (user.getCurrentStatus() !== UserStatusEnum.DISCONNECTED) return false;

            const elapsedTimeInMinutes = Math.floor((Date.now() - user.getTime().leave) / 60000);

            return elapsedTimeInMinutes >= minutes;
        });
        if (expiredUserList.length > 0) {
            console.log(`Deleting ${expiredUserList.length} inactive user!`);
            expiredUserList.forEach((user: User) => {
                if (user.getRoomId() !== null) {
                    const self = this;
                    const cleanupFC = (userId: string) => {
                        const usr = self.getUserById(userId);
                        if (usr === undefined) return;

                        Room.getInstance().removeUserFromRoom(usr);
                    }

                    Room.getInstance().destroyRoom(user.getRoomId(), cleanupFC);
                }

                this.removeFromConnectedUsers(user.id);
            });
        }
    }

    addToConnectedUsers = (user: User): void => {
        const exists = this.connectedUsers.find(connectedUser => connectedUser.id === user.getId());

        if (!exists) this.connectedUsers.push(user);

        this.server.emit('userNumberChanged', this.connectedUsers.length);
    }

    removeFromConnectedUsers = (id: string): void => {
        const filteredConnectedUsers = this.connectedUsers.filter((connectedUser: User) => connectedUser.getId() !== id);

        this.connectedUsers = filteredConnectedUsers;
        this.server.emit('userNumberChanged', this.connectedUsers.length);
    }

    getAuthToken = (socket: any): string | null => {
        const token: string | undefined = socket.handshake.auth?.token;

        return isValidToken(token) ? token : undefined;
    }

    getUserById = (userId: string): User | undefined => {
        return this.connectedUsers.find(connectedUser => connectedUser.id === userId);
    }

    recoverUser = (token: string): User | undefined => {
        const user: User | undefined = this.getUserById(token);
        console.log(this.connectedUsers.map((usr: User) => usr.getId()));
        console.log('recover', user);
        user?.recover();
        return user;
    }

    onConnect = (client): void => {
        const token: string | undefined = this.getAuthToken(client) || uuidv4();
        console.log('somebody connected with', token);
        let user = this.recoverUser(token) || new User(token, client);
        user.setSocket(client);

        this.listenUserInteraction(user, client);
        client.emit('userAuthDone', token);

        this.addToConnectedUsers(user);

        if (user.getRoomId() !== null) {
            console.log('kikuldeni');
            user.getSocket().emit('userRoomIdChanged', user.getRoomId());
        }
    }

    listenUserInteraction = (user: User, client): void => {
        client.on('updateData', (data: UserDataInterface) => user.updateUserData(data));
        client.on('startSearch', () => {
            this.queue.addToQueue(user, () => {
                this.queue.searchForPartner(user, (partner) => {
                    console.log('Found partner: ', partner.getId());
                    this.queue.removeFromQueue(user);
                    this.queue.removeFromQueue(partner);
                    const roomId = Room.getInstance().generateRoom();
                    console.log('Generated room: ', roomId);

                    [user, partner].forEach((u: User) => {
                        Room.getInstance().addUserToRoom(u, roomId, () => {
                            u.setStatus(UserStatusEnum.IN_CHAT);
                            u.getSocket().emit('partnerFound', true);
                            console.log('Added user to room: ', u.getId());

                        });
                    });


                });

            });
            this.server.emit('queuePopulation', Queue.getQueue().length);
        });
        client.on('cancelSearch', () => {
            this.queue.removeFromQueue(user);
            this.server.emit('queuePopulation', Queue.getQueue().length);
        });
        client.on("disconnect", (reason) => {
            user.disconnect(Date.now(), reason);
            this.queue.removeFromQueue(user.getId());
            if (user.getRoomId() !== null) {
                const room = Room.getInstance().getRoomById(user.getRoomId());
                const partnerIdFromRoom = room.users.find(usr => usr !== user.getId());
                const partner: User | undefined = this.connectedUsers.find(usr => usr.getId() === partnerIdFromRoom);
                if (partner !== undefined && partner.getCurrentStatus() === UserStatusEnum.DISCONNECTED) {
                    Room.getInstance().removeUserFromRoom(user);
                    Room.getInstance().removeUserFromRoom(partner);
                }
            }
        });
    }
}