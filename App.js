const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const sessionRoutes = require('./routes/session-routes');
const userRoutes = require('./routes/user-routes');
const HttpError = require('./modules/http-error');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const userList = [];
const fs = require('fs');
const path = require('path');
app.use(cors());




app.use(bodyParser.json());

app.use(express.json());


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET , POST, PATCH, DELETE');
    next();
});
app.get('/api/', async (req, res, next) => {
    return res.json({
        message: "Welcome"
    })
})
app.use('/api/session', sessionRoutes);
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
});

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jbeoso0.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: '*',
                methods: ["GET", "POST","DELETE","PATCH"],
            },
        });

        io.on("connection", (socket) => {
            let room;

            socket.on("join_room", (data) => {
                room = data;
                socket.join(data);
            });

            socket.on("send_message", (data) => {
                socket.to(data.room).emit("receive_message", data);
            });

            socket.on("disconnect", () => {
                // Handle disconnect event
            });

            socket.on("leave_room", (roomID) => {
                // Leave the room
                socket.leave(roomID);
            });

            socket.on("navigate_to_home", (data) => {
                if (!data || data.room !== room || !data.session.users.includes(data.user)) {
                    return; // Abort if the room in the data doesn't match the current room
                }
                socket.to(room).emit("navigate_client", data);
            });
        });

        server.listen(process.env.PORT || 5000, () => {
            console.log("Server is running on port 5000");
        });

        io.listen(server, {
            path: "/socket.io",
            serveClient: false,
            pingInterval: 10000,
            pingTimeout: 5000,
            cookie: false,
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });