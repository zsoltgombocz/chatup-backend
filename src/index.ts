import express from "express";
import { ServerInterface, SocketServer } from "./Server";
import { instrument } from "@socket.io/admin-ui";
import chatRoutes from "./routes/chatRoutes";
import bodyParser from "body-parser";

require('dotenv').config();

const API_PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.PORT || 3001;

const apps = {
    api: express(),
    socket: express()
}

apps.api.set("port", 3000);
apps.socket.set("port", 3001);

let http = {
    api: require("http").Server(apps.api),
    socket: require("http").Server(apps.socket),
}

apps.api.use(bodyParser.json());

apps.api.use('/chat', chatRoutes);

apps.api.get("/", (req: any, res: any) => {
    res.json({ message: 'ChatUp backend server. Version: 1.0.0' });
});

const socket: ServerInterface = new SocketServer(http.socket);

instrument(socket.server, {
    auth: {
        type: "basic",
        username: process.env.ADMIN_NAME,
        password: process.env.ADMIN_PW
    },
    mode: "development",
});

http.api.listen(API_PORT, function () {
    console.log(`API listening on ${API_PORT}`);
});

http.socket.listen(SOCKET_PORT, function () {
    console.log(`Socket listening on ${SOCKET_PORT}`);
});