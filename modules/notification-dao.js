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
    
    const type = inputType;
    const content = inputContent;
    await db.run(SQL`
        DELETE FROM notification
        WHERE type = ${type} AND content = ${content}`);
}

async function changeNotificationReadStateById(notificationId){
    const db = await dbPromise;

    const id = notificationId;
    const hasRead = 1;
    await db.run(SQL`
        UPDATE notification
        SET read = ${hasRead}
        WHERE id = ${id}`);
}


module.exports={
    addNotification,
    getNotificationByUserId,
    deleNotification,
    deleNotification,
    changeNotificationReadStateById
}