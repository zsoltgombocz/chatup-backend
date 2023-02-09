import { version, validate } from 'uuid';

export const isValidToken = (token: string) => {
    return validate(token) && version(token) === 4;
}