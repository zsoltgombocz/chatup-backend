import { randomTopicInterface } from "./interfaces";
import topics from '../conf/topics.json';
import { randomNumber } from "./randomNumber";

const TOPICS = topics as string[];

const generateIndex = (excludeNumbers: number[]): number => {
    let randomIndex: number = randomNumber(0, TOPICS.length - 1);
    const arrayOfExcludeNumbers: number[] = [...new Set(excludeNumbers)];

    if (arrayOfExcludeNumbers.length === 50) return -1;

    while (excludeNumbers.includes(randomIndex)) {
        randomIndex = randomNumber(0, TOPICS.length - 1);
    }

    return randomIndex;
}

export const getRandomTopic = (exclude?: number[]): randomTopicInterface => {
    const randomIndex: number = generateIndex(exclude);

    return {
        index: randomIndex,
        text: randomIndex !== -1 ? TOPICS[randomIndex] : null,
    }
}