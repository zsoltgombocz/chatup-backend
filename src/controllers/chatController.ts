import { Request, Response, NextFunction } from 'express';
import { getRandomTopic } from '../utils/getRandomTopic';

const randomTopic = async (req: Request, res: Response, next: NextFunction) => {
    const excludeTopic: number[] = req.body.exclude || [];

    const randomTopic = getRandomTopic(excludeTopic);

    res.json(randomTopic);
}

export default {
    randomTopic
}
