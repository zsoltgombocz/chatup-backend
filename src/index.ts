import express from "express";
import { SocketServer } from "./Server";
import { User } from "./User";

require('dotenv').config();

const app = express();
app.set("port", process.env.PORT || 3000);

let http = require("http").Server(app);

app.get("/", (req: any, res: any) => {
    res.json({ message: 'ChatUp backend server. Version: 1.0.0' });
});

new SocketServer(http);

http.listen(3000, function () {
    console.log("listening on *:3000");
});