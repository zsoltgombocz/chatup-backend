import { Gender, UserStatusEnum } from "./enums";
export interface UserDataInterface {
    //If users location not a string (county), it means he/she/it is in every county
    location: string | null | undefined,
    ownGender: Gender,
    partnerGender: Gender,
    counties: string[],
    mapPref: number,
    interests: string[],
    valid: boolean,
}

interface timeInterface {
    join: number | null,
    leave: number | null,
}

interface roomIdInterface {
    current: string | null,
    last: string | null,
}

export interface UserInterface {
    id: string,
    socket: any,
    status: UserStatusEnum,
    userDisconnectCallbackFC: Function | undefined,
    userData: UserDataInterface | null,
    time: timeInterface,
    disconnectReason: string | undefined,
    roomId: roomIdInterface,

    //GETTERS
    getSocket(): any,
    getId(): string,
    getTime(): timeInterface,
    getCurrentStatus(): UserStatusEnum,
    getRoomId(): roomIdInterface,
    getUserData(): UserDataInterface,

    //SETTERS
    setSocket(socket: any): void,
    setStatus(status: UserStatusEnum): void,
    updateUserData(data: UserDataInterface): void
    setTime(join: number | null | undefined, leave: number | null | undefined): void
    setCurrentRoomId(roomId: string | null): void
    setLastRoomId(roomId: string | null): void

    //FUNQ
    isPairableWith(user: User): boolean
    disconnect(time: number, reason?: string): void
    recover(): void
    leaveAllSocketRoom(): void,
}

export class User implements UserInterface {
    id;
    socket = null;
    status = UserStatusEnum.IDLE;
    userDisconnectCallbackFC = undefined;
    userData = null;
    time = {
        join: Date.now(),
        leave: null,
    };
    disconnectReason = undefined;
    roomId = {
        current: null,
        last: null,
    };

    constructor(id, socket: any) {
        this.socket = socket;
        this.id = id;
        this.time.join = socket?.handshake?.issued;
    }

    setTime = (join: number | null | undefined, leave: number | null | undefined): void => {
        this.time.join = join !== undefined ? join : this.time.join;
        this.time.leave = leave !== undefined ? leave : this.time.leave;
    }

    getSocket = (): any => {
        return this.socket;
    }

    getId = (): string => {
        return this.id;
    }

    getTime = (): timeInterface => {
        return this.time;
    }

    getCurrentStatus = (): UserStatusEnum => {
        return this.status;
    }

    getRoomId = (): roomIdInterface => {
        return this.roomId;
    }

    getUserData = (): UserDataInterface => {
        return this.userData;
    }

    setSocket = (socket: any): void => {
        this.socket = socket;
    }

    setStatus = (status: UserStatusEnum) => {
        this.socket?.emit('userStatusChanged', status);
        this.status = status;
    }

    getLocation = (): null | string => {
        if (typeof this.userData.location === "string") return this.userData.location;

        return null;
    }

    updateUserData = (data: UserDataInterface) => {
        this.socket?.emit('userDataChanged', data);
        this.userData = data;
    }

    setCurrentRoomId = (roomId: string | null): void => {
        this.socket?.emit('userRoomIdChanged', roomId);
        this.setLastRoomId(this.roomId.current !== null ? this.roomId.current : roomId);

        this.roomId.current = roomId;
    }

    setLastRoomId = (roomId: string | null): void => {
        this.roomId.last = roomId;
    }

    //Checks if partners own and prefered gender match with user's
    //Returns true if matchable
    #genderCheck(partnerOwn: Gender, partnerPreference: Gender): boolean {
        console.log('Gender check started:');
        console.log(`Searcher values: own: ${this.getUserData()?.ownGender} | partnerPref: ${this.getUserData()?.partnerGender}`);
        console.log(`Partner values: own: ${partnerOwn} | partnerPref: ${partnerPreference}`);
        if (this.userData.ownGender !== partnerPreference && partnerPreference !== Gender.ALL) return false;
        if (this.userData.partnerGender !== partnerOwn && this.userData.partnerGender !== Gender.ALL) return false;

        return true;
    }

    //Checks if partners location and prefered counties are match for the user
    //Returns true if matchable
    #locationCheck(partnerLocation: string | null, partnerPreferedCounties: string[], partnerMapPref: number): boolean {
        const userLocation: string | null = this.getLocation();
        const userPreferedCounties: string[] = this.userData.counties;
        console.log('Location check started:');
        console.log(`Searcher values: location: ${userLocation} | prefCounties: ${userPreferedCounties}`);
        console.log(`Partner values: location: ${partnerLocation} | prefCounties: ${partnerPreferedCounties} | checkbox: ${partnerMapPref}`);
        if (this.userData.mapPref === 0 && partnerMapPref === 0) return true;

        if (this.userData.mapPref === 0 && partnerLocation === null && partnerPreferedCounties.includes(userLocation)) return true;
        if (partnerMapPref === 0 && userLocation === null && userPreferedCounties.includes(partnerLocation)) return true;

        if (userLocation === null && partnerLocation === null) return false;

        if (partnerPreferedCounties.includes(userLocation) && userPreferedCounties.includes(partnerLocation)) return true;

        return false;
    }
    //Check if the selected partner is pairable with the user
    isPairableWith = (partner: User, strict: boolean = true): boolean => {
        console.log(`User (${this.getId()}) started checking values with ${partner.getId()}.`);
        if (this.userData === null) false;
        //Check gender

        const gender: boolean = this.#genderCheck(partner.userData.ownGender, partner.userData.partnerGender);
        console.log(gender ? 'Gender check passed!' : 'Gender check failed!');
        if (!gender) return false;

        //Check location
        const location: boolean = this.#locationCheck(partner.getLocation(), partner.userData.counties, partner.userData.mapPref);
        console.log(gender ? 'Location check passed!' : 'Location check failed!');
        if (!location) return false;

        return true;
    }

    //When user disconnected call this function to manage user leftover object
    disconnect = (time: number, reason?: string) => {
        this.time.leave = time;
        this.disconnectReason = reason ?? 'Unknown';
        this.status = UserStatusEnum.DISCONNECTED;
        console.log('user disconnected', this.id);

    }

    recover = () => {
        this.time.join = Date.now();
        this.time.leave = null;
        this.disconnectReason = undefined;
        this.status = UserStatusEnum.IDLE;
    }

    leaveAllSocketRoom = (): void => {
        const rooms: string[] = Object.keys(this.socket.rooms);

        //First element always the own room. We want to leave the manuallz assigned rooms.
        rooms.shift();
        rooms.forEach(roomId => {
            this.socket.leave(roomId);
        });
    }
}