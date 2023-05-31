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
    console.log("input subscribe id: "+inputSubscribeId);
    const subscribeData =  await db.get(SQL`
        select * from subscribe
        where id=${subscribeId}`);

    console.log("subscribeData: " + JSON.stringify(subscribeData));

    return subscribeData;
}


module.exports={
    getSubscribeDataByAuthorId,
    getSubscribeDataBySubscribeId
}