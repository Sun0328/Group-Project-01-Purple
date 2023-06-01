const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getSubscribeDataByAuthorId(inputSenderId){
    const db = await dbPromise;
    
    const senderId = inputSenderId;
    const subscribeData = await db.all(SQL`
    select * from subscribe
    where author_id = ${senderId}`);

    return subscribeData;
}

async function getSubscribeDataBySubscribeId(inputSubscribeId){
    const db = await dbPromise;

    const subscribeId = inputSubscribeId;
    const subscribeData =  await db.get(SQL`
        select * from subscribe
        where id=${subscribeId}`);


    return subscribeData;
}


module.exports={
    getSubscribeDataByAuthorId,
    getSubscribeDataBySubscribeId
}