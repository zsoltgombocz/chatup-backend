import express from "express";
import { ServerInterface, SocketServer } from "./Server";
import { instrument } from "@socket.io/admin-ui";

require('dotenv').config();

const app = express();
app.set("port", process.env.PORT || 3000);

let http = require("http").Server(app);

app.get("/", (req: any, res: any) => {
    res.json({ message: 'ChatUp backend server. Version: 1.0.0' });
});

const sokcetIOServer: ServerInterface = new SocketServer(http);

instrument(sokcetIOServer.server, {
    auth: false,
    mode: "development",
});

http.listen(3000, function () {
    console.log("listening on *:3000");
});