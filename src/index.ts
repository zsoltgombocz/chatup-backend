import express from "express";
import { ServerInterface, SocketServer } from "./Server";
import { instrument } from "@socket.io/admin-ui";

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();
app.set("port", PORT);

let http = require("http").Server(app);

app.get("/", (req: any, res: any) => {
    res.json({ message: 'ChatUp backend server. Version: 1.0.0' });
});

const socket: ServerInterface = new SocketServer(http);

instrument(socket.server, {
    auth: {
        type: "basic",
        username: process.env.ADMIN_NAME,
        password: process.env.ADMIN_PW
    },
    mode: "development",
});

http.listen(PORT, function () {
    console.log(`Listening on *:${PORT}`);
});