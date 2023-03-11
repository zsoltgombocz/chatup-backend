import express from 'express';
import chatController from "../controllers/chatController";

const chatRoutes = express.Router();

chatRoutes.get('/topic', chatController.randomTopic);

export default chatRoutes;