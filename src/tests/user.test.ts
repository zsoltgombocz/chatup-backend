import { User } from "../User";
import { v4 as uuidv4 } from 'uuid';
import { Gender } from "../enums";

const assert = require('assert')

describe('User teszt', function () {
  describe('Pár keresés - Nemi identitás', function () {
    const token_1: string | undefined = uuidv4();
    const token_2: string | undefined = uuidv4();
    const user_1: User = new User(token_1, null);
    const user_2: User = new User(token_2, null);

    it('Várt visszatérési érték ha nem egyeznek a preferenciák hamis.', function () {
      user_1.updateUserData({
        location: undefined,
        ownGender: Gender.FEMALE,
        partnerGender: Gender.FEMALE,
        counties: [],
        mapPref: 0,
        interests: [],
        valid: true
      });

      user_2.updateUserData({
        location: undefined,
        ownGender: Gender.MALE,
        partnerGender: Gender.FEMALE,
        counties: [],
        mapPref: 0,
        interests: [],
        valid: true
      })

      assert.equal(user_1.isPairableWith(user_2), false);
    });
    it('Várt visszatérési érték ha egyeznek a preferenciák igaz.', function () {
      user_1.updateUserData({
        location: undefined,
        ownGender: Gender.FEMALE,
        partnerGender: Gender.MALE,
        counties: [],
        mapPref: 0,
        interests: [],
        valid: true
      });

      user_2.updateUserData({
        location: undefined,
        ownGender: Gender.MALE,
        partnerGender: Gender.FEMALE,
        counties: [],
        mapPref: 0,
        interests: [],
        valid: true
      })

      assert.equal(user_1.isPairableWith(user_2), true);
    });
  });
});