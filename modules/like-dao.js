const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getLikeNumberByArticleId(inputArticleID){
    const db = await dbPromise;

    const articleID = inputArticleID;
    const likeData = await db.all(SQL`
        select * from likes
        where article_id = ${articleID}`);

    let counter = 0;
    for (let i = 0; i < likeData.length; i++)
    {
        counter = counter + 1;
    }
    return counter;
}

async function getLikeStateByUserIDandArticleId(inputUserId, inputArticleId){
    const db = await dbPromise;

    const userId = inputUserId;
    const articleId = inputArticleId;
    const likeData = await db.get(SQL`
        select * from likes
        where user_id=${userId} and article_id=${articleId}`);
    return likeData;
}


async function addLike(inputUserId, inputArticleId){
    const db = await dbPromise;

    const userId = inputUserId;
    const articleId = inputArticleId;
    await db.run(SQL `
    INSERT INTO likes (user_id, article_id)
    VALUES (${userId}, ${articleId})`)
}

async function deleLike(inputUserId, inputArticleId){
    const db = await dbPromise;

    const userId = inputUserId;
    const articleId = inputArticleId;
    await db.run(SQL`
        DELETE FROM likes
        WHERE user_id = ${userId} AND article_id = ${articleId}`);
}

async function getLikeArticleByUserId(inputUserId){
    const db = await dbPromise;

    const userId = inputUserId;
    const articleData = await db.all(SQL`
        select * from likes
        where user_id = ${userId}`);
    return articleData;
}

module.exports={
    getLikeNumberByArticleId,
    getLikeStateByUserIDandArticleId,
    addLike,
    deleLike,
    getLikeArticleByUserId
}