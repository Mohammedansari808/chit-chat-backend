import express from "express"
import mongodb, { MongoClient, ObjectId } from "mongodb"
import bcrypt from "bcrypt"

import http from "http"
import cors from "cors"
import { Server } from "socket.io";
import credentialRouter from "./routes/credentials.routes.js"
import messengerRouter from "./routes/messenger.routes.js"
const app = express()
app.use(cors())
app.use(express.json())
const MONGO_URL = "mongodb://127.0.0.1"
const client = new MongoClient(MONGO_URL)
await client.connect()
console.log("mongo is connected")
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});
app.use("/", credentialRouter)
app.use("/", messengerRouter)
app.get("/", function (request, response) {
    console.log("express connected")
})
const users = []
const adduser = (userID, socketID) => {
    !users.some((user) => (user.userID === userID)) &&
        users.push({ userID, socketID })
}
const getReceiverS = (userId) => {

    return users.find((user) => user.userID === userId)
}
io.on("connection", (socket) => {

    console.log("user connected")
    socket.on("addUsers", (userID) => {
        adduser(userID, socket.id)
        console.log(users)
        io.emit("getUsers", users)
    })
    socket.on("sendMessage", (data) => {
        console.log(data.receiver_id)
        const ruser = getReceiverS(data.receiver_id)
        console.log(ruser)
        io.to(ruser.socketID).emit("getMessage", {
            senderID: "hoi",
            text: data.text
        })

    })
})


app.post("/add", async function (request, response) {
    console.log("in")
    const data = request.body
    const insertData = await client.db("chitchat").collection('conversation').insertOne({
        conversationID: new ObjectId(),
        members: [
            new ObjectId("6426ea3079a058f5f63038a1"),
            new ObjectId("6426ea3079a058f5f63038a2")
        ]
    })

})

server.listen(4000, () => {
    console.log("server is running")

})

export { client }
// app.listen(4000, () => { console.log("express connected") })