import { v4 as uuidv4 } from 'uuid';
import { User } from './User';
import { RedisServer } from './RedisServer';

export interface RoomInterface {
    generateRoom: () => string,
    addUserToRoom: (user: User, roomId: string, cb?: Function | undefined) => void,
    removeUserFromRoom: (user: User, roomId?: string, cb?: Function | undefined) => void,
    getRoomById: (roomId: string) => SingleRoomInterface | undefined,
    getPartner: (user: User) => string,
    getAllMessages: (roomId: string) => Promise<MessageInterface[]>,
    addMessage: (user: User, message: string, isNeutral: boolean) => Promise<boolean>,
    addReaction: (user: User, messageId: string, reaction: string | undefined) => Promise<boolean>,
    sendOutMessages: (user: User, roomId: string) => Promise<void>
}

export interface SingleRoomInterface {
    id: string,
    users: string[]
}

export interface RawMessageInterface {
    from: string | number,
    content: string
}

export interface MessageInterface extends RawMessageInterface {
    id: string,
    reaction: string,
    visibleFor?: string | undefined
}
export class Room implements RoomInterface {
    private static instance: Room;
    private static rooms: SingleRoomInterface[] = [];

    private constructor() { }

    static getInstance = (): Room => {
        if (!Room.instance) {
            Room.instance = new Room();
        }

        return Room.instance;
    }

    static getRoomList = (): SingleRoomInterface[] => Room.rooms;

    generateRoom = (): string => {
        const roomId = uuidv4();
        Room.rooms.push({
            id: roomId,
            users: []
        } as SingleRoomInterface);

        return roomId;
    }

    addUserToRoom = (user: User, roomId: string, cb?: Function | undefined): void => {
        const room = this.getRoomById(roomId);
        if (room === undefined && room?.users?.length < 2) return;

        this.removeUserFromRoom(user);
        user.leaveAllSocketRoom();

        user.getSocket().join(roomId);

        user.setCurrentRoomId(roomId);
        room?.users?.push(user.getId());
        cb?.();
    }

    removeUserFromRoom = (user: User, roomId?: string, cb?: Function | undefined): void => {
        const room = this.getRoomById(roomId) || Room.rooms.find(room => room.users.includes(user.getId()));
        if (room === undefined) return;

        user.getSocket().leave(roomId);

        user.setCurrentRoomId(null);
        room.users = room.users.filter(u => u !== user.getId());
        cb?.();
    }

    getRoomById = (roomId: string): SingleRoomInterface | undefined => {
        return Room.rooms.find(room => room.id === roomId);
    }

    getPartner = (user: User): string => {
        const room: SingleRoomInterface | undefined = this.getRoomById(user.getRoomId().current);
        if (room === undefined) return undefined;

        return room.users.find(userId => userId !== user.getId());
    }

    static deleteEmptyRooms = (): void => {
        const nonEmptyRooms = Room.rooms.filter(room => room.users.length !== 0);
        console.log(`Deleted ${Room.rooms.length - nonEmptyRooms.length} rooms!`);
        console.log('Rooms:', nonEmptyRooms.map(room => room.id));
        Room.rooms = nonEmptyRooms;
    }

    destroyRoom = (roomId: string, cleanup: Function | undefined): void => {
        const room: SingleRoomInterface | undefined = this.getRoomById(roomId);
        if (room === undefined) return;

        room.users.forEach(userId => {
            cleanup?.(userId);
        });
    }

    isUserInRoom = (user: User, roomId: string): boolean => {
        const room: SingleRoomInterface | undefined = Room.rooms.find(r => r.id === roomId);
        if (room === undefined) return false;

        return room.users.includes(user.getId());
    }

    getAllMessages = (roomId: string): Promise<MessageInterface[]> => {
        return new Promise<MessageInterface[]>(async (resolve, reject) => {
            try {
                const rawMessages: string[] = await RedisServer.getInstance().lrange(roomId, 0, -1);

                const messages: MessageInterface[] = rawMessages.map(message => JSON.parse(message));

                resolve(messages);
            } catch (error) {
                reject([]);
            }

        });
    }

    addMessage = (user: User, message: string, isNeutral = false): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            const room: SingleRoomInterface | undefined = this.getRoomById(user.getRoomId().current);
            console.log(message);
            if (room === undefined || message.length === 0) reject(false);

            try {
                const messageObject: MessageInterface = {
                    content: message,
                    id: uuidv4(),
                    from: isNeutral ? -1 : user.getId(),
                    reaction: undefined,
                    visibleFor: isNeutral ? user.getId() : undefined
                }

                RedisServer.getInstance().rpush(room.id, JSON.stringify(messageObject));
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    addReaction = (user: User, messageId: string, reaction: string | undefined): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            const room: SingleRoomInterface | undefined = this.getRoomById(user.getRoomId().current);
            if (room === undefined) reject(false);

            try {
                const allMessages: MessageInterface[] = await this.getAllMessages(room.id);
                const messageIndex: number = allMessages.findIndex(msg => msg.id === messageId);
                if (messageIndex === -1) reject(false);

                const message: MessageInterface = allMessages[messageIndex];

                await RedisServer.getInstance().lset(room.id, messageIndex, JSON.stringify({
                    ...message,
                    reaction
                } as MessageInterface));

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    sendOutMessages = async (user: User, roomId: string): Promise<void> => {
        const updatedMessages = await Room.getInstance().getAllMessages(roomId);
        user.getSocket().to(roomId).emit('updatedMessages', updatedMessages);
        user.getSocket().emit('updatedMessages', updatedMessages);
    }
}