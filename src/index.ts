import express from "express";
import chatRoutes from "./routes/chatRoutes";
import bodyParser from "body-parser";

require('dotenv').config();

const API_PORT = process.env.SOCKET_PORT || 3000;
const SOCKET_PORT = process.env.API_PORT || 3001;

const apps = {
    api: express(),
    socket: express()
}

apps.api.set("port", API_PORT);
apps.socket.set("port", SOCKET_PORT);

let http = {
    api: require("http").Server(apps.api),
    socket: require("http").Server(apps.socket),
}

apps.api.use(bodyParser.json());

apps.api.use('/chat', chatRoutes);

apps.api.get("/", (req: any, res: any) => {
    res.json({ message: 'ChatUp API v1.0.0' });
});

http.api.listen(API_PORT, function () {
    console.log(`API listening on ${API_PORT}`);
});

http.socket.listen(SOCKET_PORT, function () {
    console.log(`Socket listening on ${SOCKET_PORT}`);
});