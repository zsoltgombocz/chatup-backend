import { User } from "../User";
import { v4 as uuidv4 } from 'uuid';
import { Gender } from "../enums";
import { Queue } from "../Queue";

const assert = require('assert')

describe('Queue teszt', function () {
    describe('Felhasználó várólistára helyezése és levétele', function () {
        const token_1: string | undefined = uuidv4();
        const user_1: User = new User(token_1, null);

        Queue.getInstance().addToQueue(user_1);

        it('Látnunk kell a hozzáadott felhasználót a listában, ellenőrízzük a lista elemszámát.', function () {
            assert.equal(Queue.getQueue().length, 1);
        });

        it('A várólista elemszáma az eltávolítás után 0 kell hogy legyen.', function () {
            Queue.getInstance().removeFromQueue(user_1);

            assert.equal(Queue.getQueue().length, 0);
        });
    });
});