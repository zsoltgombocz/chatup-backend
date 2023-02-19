import { Gender, UserStatusEnum } from "./enums";
export interface UserDataInterface {
    //If users location not a string (county), it means he/she/it is in every county
    location: string | null | undefined,
    ownGender: Gender,
    partnerGender: Gender,
    counties: string[],
    mapPref: number,
    interests: string[],
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
    updateUserData(data: UserDataInterface): void

    //FUNQ
    isPairableWith(user: User, strict?: boolean): boolean
}

export class User implements UserInterface {
    id;
    socket = null;
    status = UserStatusEnum.IDLE;
    userDisconnectCallbackFC = undefined;
    userData = null;

    constructor(id, socket: any, userDisconnectFC: Function | undefined, deleteUser: Function | undefined) {
        this.socket = socket;
        this.id = id;
        this.userDisconnectCallbackFC = userDisconnectFC;

        socket.on("disconnect", (reason) => {
            console.log(`${socket.id} disconnected: ${reason}`);
            this.userDisconnectCallbackFC?.();
            this.setStatus(UserStatusEnum.DISCONNECTED);
            //store disconnect time, and let the cleanup delete from the users list            
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
        this.socket.emit('userStatusChanged', status);
        this.status = status;
    }

    getLocation = (): null | string => {
        if (typeof this.userData.location === "string") return this.userData.location;

        return null;
    }

    updateUserData = (data: UserDataInterface) => {
        this.userData = data;
    }

    //Checks if partners own and prefered gender match with user's
    //Returns true if matchable
    #genderCheck(partnerOwn: Gender, partnerPreference: Gender): boolean {
        if (this.userData.ownGender !== partnerPreference && partnerPreference !== Gender.ALL) return false;
        if (this.userData.partnerGender !== partnerOwn && this.userData.partnerGender === Gender.ALL) return false;

        return true;
    }

    //Checks if partners location and prefered counties are match for the user
    //Returns true if matchable
    #locationCheck(partnerLocation: string | null, partnerPreferedCounties: string[], partnerMapPref: number): boolean {
        const userLocation: string | null = this.getLocation();
        const userPreferedCounties: string[] = this.userData.counties;

        if (this.userData.mapPref === 0 && partnerMapPref === 0) return true;

        if (this.userData.mapPref === 0 && partnerLocation === null && partnerPreferedCounties.includes(userLocation)) return true;
        if (partnerMapPref === 0 && userLocation === null && userPreferedCounties.includes(partnerLocation)) return true;

        if (userLocation === null && partnerLocation === null) return false;

        if (partnerPreferedCounties.includes(userLocation) && userPreferedCounties.includes(partnerLocation)) return true;

        return false;
    }
    //Check if the selected partner is pairable with the user
    isPairableWith = (partner: User, strict: boolean = true): boolean => {
        if (this.userData === null) false;
        //Check gender
        const gender: boolean = this.#genderCheck(partner.userData.ownGender, partner.userData.partnerGender);
        if (!gender) return false;

        //Check location
        const location: boolean = this.#locationCheck(partner.getLocation(), partner.userData.counties, partner.userData.mapPref);
        if (!location) return false;

        return true;
    }
}