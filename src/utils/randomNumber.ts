export const randomNumber = (min: number = 0, max: number = 1000): number => {
    return Math.floor(Math.random() * (max - min) + min);
}