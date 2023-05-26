const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getSubscribeDataByAuthorId(inputSenderId){
    const db = await dbPromise;
    
    const senderId = inputSenderId;
    console.log("-----------------in dao------------");
    console.log("senderId: " + senderId);
    const subscribeData = await db.all(SQL`
    select * from subscribe
    where author_id = ${senderId}`);

    return subscribeData;
}

module.exports={
    getSubscribeDataByAuthorId
}