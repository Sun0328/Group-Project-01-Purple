const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function addNotification(inputReceiverId, inputSenderId, inputType, inputContent, inputTime){
    const db = await dbPromise;

    const receiverId = inputReceiverId;
    const senderId = inputSenderId;
    const type = inputType;
    const content = inputContent;
    const time = inputTime;
    const read = 0;

    await db.run(SQL`
        INSERT INTO notification (content, type, time,sender_id, receiver_id, read)
        VALUES (${content}, ${type}, ${time},${senderId}, ${receiverId}, ${read})`);

}

async function getNotificationByUserId(inputUserId){
    const db = await dbPromise;

    const userId = inputUserId;
    const notificationData = await db.all(SQL`
        select * from notification
        where receiver_id = ${userId}
        order by time DESC`)
    return notificationData;

}

async function deleNotification(inputType, inputContent){
    const db = await dbPromise;
    console.log("inside delete notification");
    const type = inputType;
    const content = inputContent;
    console.log("type is "+type+" content is "+content);
    await db.run(SQL`
    delete from notification
    where type = ${type} AND content = ${content};`);
}

module.exports={
    addNotification,
    getNotificationByUserId,
    deleNotification,
}