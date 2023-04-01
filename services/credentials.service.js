import { client } from "../index.js";

export async function updatePassword(username, Hashedpassword) {
    return await client.db("chitchat").collection("login").updateOne({ username: username }, { $set: { password: Hashedpassword } });
}
export async function otpCheck(username) {
    return await client.db("chitchat").collection("otp").findOne({ username: username });
}
export async function ForgetCheck(username) {
    return await client.db("chitchat").collection("login").findOne({ username: username });
}
export async function lLoginCheck(data) {
    return await client.db("chitchat").collection("login").findOne({ username: data.username });
}
export async function unsetVerify_link(username, link) {
    await client.db("chitchat").collection("signupusers").updateOne({ username: username }, { $unset: { verify_link: link } });
}
export async function verify_linkCheck(link) {
    return await client.db("chitchat").collection("signupusers").findOne({ verify_link: link });
}
export async function signupInsert(finalData) {
    return await client.db("chitchat").collection("signupusers").insertOne(finalData);
}
export async function loginEmailCheck(email) {
    return await client.db("chitchat").collection("login").findOne({ email: email });
}
export async function loginUserCheck(username) {
    return await client.db("chitchat").collection("login").findOne({ username: username });
}
export async function signupEmailCheck(email) {
    return await client.db("chitchat").collection("signupusers").findOne({ email: email });
}
export async function signupUserCheck(username) {
    return await client.db("chitchat").collection("signupusers").findOne({ username: username });
}
