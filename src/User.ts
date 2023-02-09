import { Gender, UserStatusEnum } from "./enums";
interface UserDataInterface {
    ownGender: Gender,
    partnerGender: Gender,
    counties: string[],
}
export interface UserInterface {
    id: string,
    socket: any,
    status: UserStatusEnum,
    userDisconnectCallbackFC: Function | undefined,
    userData: UserDataInterface | null,

    //GETTERS
    getSocket(): any,
    getId(): string,

    //SETTERS
    setSocket(socket: any): void,
    setStatus(status: UserStatusEnum): void,
}

export class User implements UserInterface {
    id;
    socket = null;
    status = UserStatusEnum.IDLE;
    userDisconnectCallbackFC = undefined;
    userData = null;

    constructor(id, socket: any, userDisconnectFC: Function | undefined) {
        this.socket = socket;
        this.id = id;
        this.userDisconnectCallbackFC = userDisconnectFC;

        socket.on("disconnect", (reason) => {
            console.log(`${socket.id} disconnected: ${reason}`);
            this.userDisconnectCallbackFC?.();
        });
    }

    getSocket = (): any => {
        return this.socket;
    }

    getId = (): string => {
        return this.id;
    }

    setSocket = (socket: any): void => {
        this.socket = socket;
    }

    setStatus = (status: UserStatusEnum) => {
        this.status = status;
    }
}