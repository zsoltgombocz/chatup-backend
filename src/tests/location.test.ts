import { User } from "../User";
import { v4 as uuidv4 } from 'uuid';
import { Gender } from "../enums";

const assert = require('assert')

/**
    NOGRAD = 'nograd',
    HEVES = 'heves',
    JNSZ = 'jnsz',
    BP = 'budapest',
    PEST = 'pest',
    FEJER = 'fejer',
    VESZP = 'veszprem',
    TOLNA = 'tolna',
    KE = 'ke',
    GYMS = 'gyms',
    VAS = 'vas',
    ZALA = 'zala',
    SOMOGY = 'somogy',
    BARANYA = 'baranya',
    BK = 'bk',
    CSONGRAD = 'csongrad',
    HB = 'hb',
    BEKES = 'bekes',
    SZSZB = 'szszb',
    BAZ = 'baz'
 */

describe('Location pairing (User 1 checking if User 2 can be a pair)\nformat: User 1 <[location?] [mapPref?] [selectedCounties?]>\nmapPref=<0: all county, 1: custom counties>', function () {
    describe('User 1 <[gyms] [0] []> User 2 <[budapest] [0] []>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 and User 2 has mapPref 0', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'budapest',
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

    describe('User 1 <[gyms] [1] [budapest]> User 2 <[budapest] [0] []>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 searching for user from "budapest" and User 2 has mapPref 0', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'budapest',
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

    describe('User 1 <[gyms] [1] [budapest]> User 2 <[baz] [0] []>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 searching for user from "baz" and User 2 is located in "budapest"', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'baz',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 <[gyms] [1] [budapest]> User 2 <[budapest] [1] [baz]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 searching for user from "budapest" and User 2 is located in "budapest" but searching for partner from "baz"', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['baz'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 <[gyms] [0] []> User 2 <[budapest] [1] [baz]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 2 searching for user from "baz" and User 1 is located in "gyms"', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['baz'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 <[gyms] [1] [budapest]> User 2 <[budapest] [1] [gyms]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 and User 2 searching for each other', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['gyms'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });

    describe('User 1 <[gyms] [0] []> User 2 <[budapest] [1] [gyms]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 in "gyms" and has mapPref 0 and User 2 searching for "gyms"', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['gyms'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });

    describe('User 1 <[gyms] [0] []> User 2 <[null] [1] [budapest]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 is searching for anybody but User 2 has a pref of "budapest" (with unknown location)', function () {
            user_1.updateUserData({
                location: 'gyms',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: null,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 <[budapest] [0] []> User 2 <[null] [1] [budapest]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 is in "budapest" and User 2 has a pref of "budapest" (with unknown location)', function () {
            user_1.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: [],
                mapPref: 0,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: null,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });

    describe('User 1 <[budapest] [1] [gyms]> User 2 <[null] [1] [baz]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return false bcz User 1 is in "budapest" searching for "gyms", User 2 has no location (he is in every county) but searching for "baz"', function () {
            user_1.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['gyms'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: null,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['baz'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), false);
        });
    });

    describe('User 1 <[budapest] [1] [gyms]> User 2 <[null] [1] [budapest]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 is in "budapest" searching for "gyms", User 2 has no location (he is in every county) searching for "budapest"', function () {
            user_1.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['gyms'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: null,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });

    describe('User 1 <[budapest] [1] [gyms]> User 2 <[undefined] [1] [budapest]>', function () {
        const user_1: User = new User(uuidv4(), null);
        const user_2: User = new User(uuidv4(), null);

        it('should return true bcz User 1 is in "budapest" searching for "gyms", User 2 has no location (he is in every county) searching for "budapest"', function () {
            user_1.updateUserData({
                location: 'budapest',
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['gyms'],
                mapPref: 1,
                interests: [],
                valid: true
            });

            user_2.updateUserData({
                location: undefined,
                ownGender: Gender.FEMALE,
                partnerGender: Gender.ALL,
                counties: ['budapest'],
                mapPref: 1,
                interests: [],
                valid: true
            })

            assert.equal(user_1.isPairableWith(user_2), true);
        });
    });
});