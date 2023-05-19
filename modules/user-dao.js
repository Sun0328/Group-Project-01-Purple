const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");


async function retrieveAllDataInLikes() {
    const db = await dbPromise;

    const testData = await db.all(SQL`
        select * from likes`);

    return testData;
}



module.exports = {
    retrieveAllDataInLikes
}