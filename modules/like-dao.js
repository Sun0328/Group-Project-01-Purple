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
    console.log("like number: " + counter);
    return counter;
}

module.exports={
    getLikeNumberByArticleId
}