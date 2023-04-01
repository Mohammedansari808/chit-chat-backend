import express from 'express'
import { resetauth } from '../middleware/resetauth.js';
import bcrypt from "bcrypt";
import nodemailer from "nodemailer"
const router = express.Router()
import { client } from "../index.js";
import jwt from "jsonwebtoken";
import { ObjectId } from 'mongodb';
import * as dotenv from 'dotenv'
import { signupUserCheck, signupEmailCheck, loginUserCheck, loginEmailCheck, signupInsert, verify_linkCheck, unsetVerify_link, lLoginCheck, ForgetCheck, otpCheck, updatePassword } from '../services/credentials.service.js';

dotenv.config()



// Authorization and Authentication
//after signup user will receive a verification mail
router.post("/signup", async function (request, response) {
    console.log("im in")
    const { username, password, email } = request.body
    const isSCheck = await signupUserCheck(username)
    const isSCheckE = await signupEmailCheck(email)
    const isCheck = await loginUserCheck(username)
    const isCheckE = await loginEmailCheck(email)
    console.log("2 good")
    if (!isCheck && !isCheckE && !isSCheck && !isSCheckE) {
        console.log("3 good")
        const Hashedpassword = await Hashed(password)
        async function Hashed(password) {
            const NO_OF_ROUNDS = 10
            const salt = await bcrypt.genSalt(NO_OF_ROUNDS)
            const HashedPassword = await bcrypt.hash(password, salt)
            return HashedPassword
        }
        let tempLink = ""
        const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789"
        const characters = character.length
        for (let i = 0; i < 60; i++) {
            tempLink += character.charAt(Math.floor(Math.random() * characters))

        }

        let finalData = {
            username: username,
            password: Hashedpassword,
            role_id: 0,
            email: email,
            verify_link: `http://localhost:3000/verify_link/${username}/${tempLink}`
        }
        const insertData = await signupInsert(finalData)
        if (insertData) {
            async function main(finalData) {
                let username = finalData.username;
                let email = finalData.email;
                let verify_link = finalData.verify_link

                let transporter = await nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_MAIL,
                        pass: process.env.SMTP_KEY,
                    },
                });
                let info = await transporter.sendMail({
                    from: '"jujutsu store" <foo@example.com>', // sender address
                    to: `${email}`, // list of receivers
                    subject: "Verification link for Signin", // Subject line
                    text: "Hello world?", // plain text body
                    html: `Hi ${username} please click the below link to verify.
                    <div style="text-align:center;margin:45px">
                    <a rel="noopener" target="_blank" href=${verify_link} target="_blank"
                     style="font-size: 18px; font-family: Helvetica, Arial, sans-serif;
                     font-weight: bold; text-decoration: none;border-radius: 5px; 
                      padding: 12px 18px; border: 1px solid #1F7F4C;background-color: 
                    darkblue ;box-shadow:2px 2px 10px grey ;color:white;display: inline-block;">
                    Verify</a>
                    </div>

                    `, // html body
                });


                console.log("Message sent: %s", info.messageId);

                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                response.send({ message: "sign verify sent" })


            }

            main(finalData).catch(console.error);

        }

    } else {
        response.send({ message: "sign fail" })
    }
})


//verification for signup will be verified and the link will be removed from the signup collection
router.get("/verify_link/:username/:id", async function (request, response) {
    const { username, id } = request.params
    const link = `http://localhost:3000/verify_link/${username}/${id}`
    const isCheck = await verify_linkCheck(link)

    if (isCheck) {
        let checkData = {
            username: isCheck.username,
            password: isCheck.password,
            role_id: isCheck.role_id,
            email: isCheck.email,
            verify_link: isCheck.verify_link,

        }
        const insertData = await client.db("chitchat").collection("login").insertOne(checkData)



        if (insertData) {
            const findData = await client.db('chitchat').collection("login").findOne({ username: checkData.username })

            if (findData) {
                const insertUserData = await client.db("chitchat").collection("usersdata").insertOne({
                    user_id: findData._id,
                    username: findData.username
                })
                if (insertUserData) {
                    response.send({ message: "sign success" })
                    await unsetVerify_link(username, link);
                } else {
                    console.log("error")
                }

            }





        }

    } else {
        response.send({ message: "error" })
    }

})


//when the login is success a token will be generated with the help of JWT.
router.post("/login", async function (request, response) {
    const data = request.body

    const loginData = await lLoginCheck(data)
    if (loginData) {

        async function comparPassword() {
            return bcrypt.compare(data.password, loginData.password);
        }
        const comparePassword = await comparPassword()
        if (comparePassword) {
            const token = jwt.sign({ _id: new ObjectId(loginData._id) }, process.env.MY_KEY)
            response.send({ message: "successful login", token: token, role_id: loginData.role_id, email: loginData.email, id: loginData._id })
        } else {
            response.send({ message: "error" })
        }
    } else {
        response.send({ message: "error" })
    }

})


//verification mail and otp will be sent to the particular user to reset password
router.post("/forgetpassword", async function (request, response) {
    const { username, email } = request.body;
    const data = await ForgetCheck(username)
    if (data.username == username && data.email == email) {
        let tempLink = ""
        const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789"
        const characters = character.length
        for (let i = 0; i < 40; i++) {
            tempLink += character.charAt(Math.floor(Math.random() * characters))

        }
        const otp = Math.floor(1000 + Math.random() * 9000)
        const otpData = {
            otp: otp,
            email: email,
            username: username,
            tempLink: `http://localhost:3000/verification-link/${username}/${tempLink}`,
        }
        const checkData = await client.db("chitchat").collection("otp").findOne({ username: username })

        if (checkData == null) {
            const otpInsertData = client.db("chitchat").collection("otp").insertOne(otpData)

            const finalData = await client.db("chitchat").collection("otp").findOne({ username: username })


            setTimeout(async () => {
                await client.db("chitchat").collection("otp").deleteOne({ otp: otpData.otp })
            }, 5 * 60 * 1000);


            async function main(finalData) {

                // Generate test SMTP service account from ethereal.email
                // Only needed if you don't have a real mail account for testing
                let username = finalData.username;
                let otp = finalData.otp;
                let email = finalData.email;
                let tempLink = finalData.tempLink
                let testAccount = await nodemailer.createTestAccount();
                // create reusable transporter object using the default SMTP transport


                let transporter = await nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    tls: {
                        rejectUnauthorized: false
                    },
                    auth: {
                        user: process.env.SMTP_MAIL,
                        pass: process.env.SMTP_KEY,
                    },
                });

                // send mail with defined transport object

                let info = await transporter.sendMail({
                    from: '"chitchat" <foo@example.com>', // sender address
                    to: `${email}`, // list of receivers
                    subject: "Verification link", // Subject line
                    text: "Hello world?", // plain text body
                    html: `Hi ${username} your otp is <strong>${otp} </strong>it will expire in two minutes
                    please paste it in the following link ${tempLink}`, // html body
                });

                response.send({ message: "link sent" });

                console.log("Message sent: %s", info.messageId);
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

                // Preview only available when sending through an Ethereal account
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

            }

            main(otpData).catch(console.error);

            ;

        }

    } else {
        response.send("error")
    }


});

//after verification is complete the otp will removed from the optdata collection
router.post("/verification-link/:username/:id", async function (request, response) {
    const { username, id } = request.params

    let data = request.body
    const otpData = await otpCheck(username)

    if (parseInt(data.otp) == parseInt(otpData.otp)) {
        const token = jwt.sign({ _id: ObjectId(data._id) }, process.env.RESET_KEY)
        await client.db("chitchat").collection("otp").deleteOne({ otp: otpData.otp })
        response.send({ message: "otp success", username: username, token: token })
    } else {
        response.send({ message: "error" })
    }

})


//for password change
router.put("/password-change/:username", resetauth, async function (request, response) {
    let data = request.body
    const { username } = request.params
    const Hashedpassword = await Hashed(data.newpassword)
    async function Hashed(password) {
        const NO_OF_ROUNDS = 10
        const salt = await bcrypt.genSalt(NO_OF_ROUNDS)
        const HashedPassword = await bcrypt.hash(password, salt)
        return HashedPassword
    }
    let checkuser = await updatePassword(username, Hashedpassword)
    if (checkuser) {
        response.send({ message: "success" })
    } else if (response.status === 404) {
        response.send({ message: "error" })
    }


})

export default router


