import { v4 as uuidv4 } from 'uuid';
import { User } from './User';

export interface RoomInterface {
    generateRoom: () => string,
    addUserToRoom: (user: User, roomId: string, cb?: Function | undefined) => void,
    removeUserFromRoom: (user: User, roomId?: string, cb?: Function | undefined) => void,
    getRoomById: (roomId: string) => SingleRoomInterface | undefined,
    getPartner: (user: User) => string,
}

export interface SingleRoomInterface {
    id: string,
    users: string[]
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

        user.setCurrentRoomId(roomId);
        room?.users?.push(user.getId());
        cb?.();
    }

    removeUserFromRoom = (user: User, roomId?: string, cb?: Function | undefined): void => {
        const room = this.getRoomById(roomId) || Room.rooms.find(room => room.users.includes(user.getId()));
        if (room === undefined) return;

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
}