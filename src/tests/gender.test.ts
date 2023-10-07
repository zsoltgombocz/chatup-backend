import { User } from "../User";
import { v4 as uuidv4 } from 'uuid';
import { Gender } from "../enums";

const assert = require('assert')

describe('Gender pairing (User 1 checking if User 2 can be a pair)', function () {
    describe('User 1 [F] -> [F], User 2 [F] -> [M]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 2 is searching for a [M] person (User 1 is a [F])', function () {
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
                ownGender: Gender.FEMALE,
                partnerGender: Gender.MALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 [F] -> [M], User 2 [F] -> [M]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 is searching for a [M] person and User 2 is a [F]', function () {
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
                ownGender: Gender.FEMALE,
                partnerGender: Gender.MALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 [M] -> [F], User 2 [F] -> [F]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 is searching for a [F] person and User 2 searching for [F]', function () {
            user_1.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.FEMALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: undefined,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.FEMALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 [M] -> [F], User 2 [F] -> [M]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz matching in gender search', function () {
            user_1.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.FEMALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: undefined,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.MALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });

    describe('User 1 [M] -> [F], User 2 [F] -> [ALL]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 2 searching for [ALL](does not matter gender)', function () {
            user_1.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.FEMALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: undefined,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });

    describe('User 1 [M] -> [F], User 2 [M] -> [ALL]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 is seraching for [F] and User 2 is a [M] (searching for [ALL])', function () {
            user_1.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.FEMALE,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 [M] -> [ALL], User 2 [M] -> [ALL]', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 is seraching for [ALL] and User 2 is searching for [ALL]', function () {
            user_1.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: undefined,
                ownGender: Gender.MALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });
});