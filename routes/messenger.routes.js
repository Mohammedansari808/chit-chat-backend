
import express from 'express'
import { auth } from "../middleware/auth.js"

const router = express.Router()
import { ObjectId } from "mongodb";
import { client } from "../index.js";
router.get("/conversation/:id", auth, async function (request, response) {
    const id = request.params
    const getData = await client.db('chitchat').collection("conversation").find({ _id: new ObjectId(id) }).toArray()
})

router.get("/usersdata", auth, async function (request, response) {
    const getData = await client.db("chitchat").collection("usersdata").find({}).toArray()
    response.send(getData)

})

router.get("/otheruserdata/:id", auth, async function (request, response) {
    const { id } = request.params
    const getData = await client.db("chitchat").collection("usersdata").findOne({ user_id: new ObjectId(id) })
    response.send(getData)

})


router.post("/conversation-create", auth, async function (request, response) {

    const { data } = request.body
    const finalData = {
        conversation_id: new ObjectId(),
        members: data,
        accept: false
    }
    const sendData = await client.db("chitchat").collection("conversation").insertOne(finalData)
    if (sendData) {
        response.send({ message: "success" })
    } else {
        response.send({ message: "fail" })
    }
})


router.get("/getconversations/:id", auth, async function (request, response) {
    const { id } = request.params
    const arr = []
    const getConversationData = await client.db('chitchat').collection('conversation').find({ members: { $elemMatch: { $eq: id } } }).toArray()
    response.send(getConversationData)

})

router.get("/get-chat/:id", auth, async function (request, response) {
    const { id } = request.params
    const getChat = await client.db('chitchat').collection("all-msgs").find({
        conversation_id: id
    }).toArray()
    response.send(getChat)

})

router.post("/send-message", auth, async function (request, response) {
    const { data } = request.body

    const sendChatData = await client.db("chitchat").collection("all-msgs").insertOne(data)
    if (sendChatData) {
        response.send({ message: "success" })
    }



})

export default router