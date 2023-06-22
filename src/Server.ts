import { Server } from 'socket.io';
import { Queue } from './Queue';
import { User, UserDataInterface } from './User';

import { v4 as uuidv4 } from 'uuid';
import { isValidToken } from './utils/isValidToken';
import { UserStatusEnum } from './enums';

import { CronJob } from 'cron';
import { Room, SingleRoomInterface } from './Room';
import { RedisServer } from './RedisServer';

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

        RedisServer.establishConnection(
            process.env.REDIS_HOST,
            6379,
            process.env.REDIS_PW
        );
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
                        usr.getSocket().emit('roomDestroyed');
                    }

                    Room.getInstance().destroyRoom(user.getRoomId().last, cleanupFC);
                }

                this.removeFromConnectedUsers(user.id);
            });

            console.log('Current user list:');
            console.log(this.connectedUsers.map((u: User) => u.getId()));
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
        user?.recover();
        console.log(
            user ?
                'Recovered user with id: ' + user?.getId()
                : 'Cannot recover user with id: ' + token);
        return user;
    }

    onConnect = (client): void => {
        const token: string | undefined = this.getAuthToken(client) || uuidv4();
        let user: User = this.recoverUser(token) || new User(token, client);
        user.setSocket(client);

        this.listenUserInteraction(user, client);
        client.emit('userAuthDone', { token, roomId: user.getRoomId() });
        client.emit('queuePopulation', Queue.getQueue().length);

        if (user.getRoomId().current) {
            user.getSocket().join(user.getRoomId().current);
        }

        this.addToConnectedUsers(user);
    }

    listenUserInteraction = (user: User, client): void => {
        client.on('startSearch', (data: UserDataInterface) => {
            if (data?.valid === false) return;

            //!: VALIDATE EVERY FIELD LATER
            user.updateUserData(data);
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
                const room: SingleRoomInterface | undefined = Room.getInstance().getRoomById(user.getRoomId().current);
                if (room === undefined) return;

                const partnerIdFromRoom = room.users.find(usr => usr !== user.getId());
                const partner: User | undefined = this.connectedUsers.find(usr => usr.getId() === partnerIdFromRoom);

                partner.getSocket().emit('partnerLeavedChat');
                Room.getInstance().addMessage(
                    partner,
                    "Partnered elhagyta a chatet! De még van esély hogy visszajön ;)",
                    true
                ).then(res => Room.getInstance().sendOutMessages(user, partner.getRoomId().current))
                    .catch(err => console.log('Error sending msg on leave', err));

                if (partner !== undefined && partner.getCurrentStatus() === UserStatusEnum.DISCONNECTED) {
                    Room.getInstance().removeUserFromRoom(user);
                    Room.getInstance().removeUserFromRoom(partner);
                }
            }
        });

        client.on("validateChat", async ({ roomId, token }, callback: Function | undefined) => {
            const user: User = this.getUserById(token);
            const room: SingleRoomInterface = Room.getInstance().getRoomById(roomId);

            if (user === undefined || room === undefined) return;
            const partner: User = this.getUserById(room.users.find(userId => userId !== token));

            const valid: boolean = Room.getInstance().isUserInRoom(user, roomId);

            if (valid) {
                user?.setStatus(UserStatusEnum.IN_CHAT);
                partner?.setStatus(UserStatusEnum.IN_CHAT);
                user?.getSocket().emit('partnerStatusChange', partner?.getCurrentStatus());
                partner?.getSocket().emit('partnerStatusChange', user?.getCurrentStatus());

                Room.getInstance().addMessage(
                    partner,
                    "Partnered csatlakozott a chathez!",
                    true
                ).then(res => Room.getInstance().sendOutMessages(user, partner.getRoomId().current))
                    .catch(err => console.log('Error sending msg on join', err));

                partner?.getSocket().emit('partnerJoinedChat');
            }

            let messages = [];
            try {
                messages = await Room.getInstance().getAllMessages(roomId);
            } catch (error) {
                console.log('Error validating - all message getting: ', error);
            }

            callback?.({
                status: valid,
                partnerData: {
                    location: partner?.getLocation(),
                    gender: partner?.getUserData().ownGender,
                    interests: partner?.getUserData().interests
                },
                partnerStatus: partner?.getCurrentStatus(),
                messages
            });
        });

        client.on('leavedChat', () => {
            const room: SingleRoomInterface | undefined = Room.getInstance().getRoomById(user.getRoomId().current);
            const partner: User = this.getUserById(room?.users.find(usr => usr !== user.getId()));

            if (room === undefined || partner === undefined) {
                console.log('leavedChat - UNDEFINED ROOM | UNDEFINED PARTNER');
                return;
            }

            console.log(`User (${user.getId()}) leaved chat, 
                sendng out event to partner (${partner.getId()}) in room:'
                `, room.id);

            partner.getSocket().emit('partnerLeavedChat');
            user.setStatus(UserStatusEnum.IDLE);
            //Room.getInstance().removeUserFromRoom(user);
        })

        client.on('roomLeaved', () => {
            const self = this;
            if (user.getRoomId().last === null) return;

            const cleanupFC = (userId: string) => {
                const usr = self.getUserById(userId);
                if (usr === undefined) return;

                //Send room destoryed to the partner (userId => current user in the room, user.getId() => user that leaved the room)
                if (userId !== user.getId()) {
                    usr.getSocket().emit('roomDestroyed');
                }
                Room.getInstance().removeUserFromRoom(usr);
            }

            Room.getInstance().destroyRoom(user.getRoomId().last, cleanupFC);

            console.log(`User (${user.getId()}) leaved room (search screen), 
                deleting room:'
                `, user.getRoomId().last);
        })

        client.on('sendMessage', (message) => {
            const currentRoom: string = user.getRoomId().current;
            Room.getInstance().addMessage(user, message)
                .then(async (res) => {
                    Room.getInstance().sendOutMessages(user, currentRoom);
                })
                .catch(err => console.log(err));
        });

        client.on('addReaction', ({ messageId, reaction }) => {
            const currentRoom: string = user.getRoomId().current;
            Room.getInstance().addReaction(user, messageId, reaction)
                .then(async (res) => {
                    Room.getInstance().sendOutMessages(user, currentRoom);
                })
                .catch(err => console.log(err));
        });

        client.on('typing', (typing) => {
            const partnerId: string | undefined = Room.getInstance().getPartner(user);
            const partner: User | undefined = this.getUserById(partnerId);
            if (partnerId === undefined || partner === undefined) return;

            client.to(partner.getSocket().id).emit('partnerTyping', typing);
        });
    }
}