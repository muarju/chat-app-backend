import express from 'express';
import cors from 'cors'
import { createServer } from 'http';
import { Server } from 'socket.io'
import mongoose from 'mongoose';

import RoomModel from './room/model.js'

// We cannot start a socket.io server on a express app.
// We need to create our express app config and pass it to a standard Node.js HTTP server
// This server will be used to initialize our socket.io server.

let onlineUsers = []

const app = express()
app.use(cors())
app.use(express.json())

app.get('/online-users', (req, res) => {
    res.status(200).send({ onlineUsers })
})

app.get("/rooms/:name", async (req, res) => {
    const room = await RoomModel.findOne({ room: req.params.name })

    res.send(room.chatHistory)
})

const httpServer = createServer(app)

// initializing our socket.io server....

const io = new Server(httpServer, { allowEIO3: true })

io.on('connection', socket => {
    console.log(socket.id)

    socket.on("setUsername", ({ username, room }) => {
        console.log(username)

        // Rooms are a server-side concept which allows socket to send a message only 
        // to some recipients who previously "joined" that room
        socket.join(room)

        // By default, when a socket is connecting, it's joining a room with the same id as its socket id
        console.log(socket.rooms)

        onlineUsers.push({ username, id: socket.id, room })

        // .emit                 will send the message back to the other side of the current channel
        // .broadcast.emit       will send the message to every other connected socket
        // .to(room).emit        will send the message to every socket connected in that room

        socket.emit("loggedin")
        socket.broadcast.emit("newConnection")
    })

    socket.on("sendmessage", async ({ message, room }) => {
        // const { text, sender, id, timestamp } = message

        // ... we should save the message to the database here...

        await RoomModel.findOneAndUpdate({ room }, {
            $push: { chatHistory: message }
        })

        // ... and then broadcast the message to the recipient(s)
        // socket.broadcast.emit("message", message)
        socket.to(room).emit("message", message)

    })

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter(user => user.id !== socket.id)
        socket.broadcast.emit("newConnection")
    })

})

// Now listening...

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
    .then(() => {
        httpServer.listen(3030, () => {
            console.log("Server listening on port 3030")
        })
    })