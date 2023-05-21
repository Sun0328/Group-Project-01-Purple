const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

// Retrieve article data
async function retrieveArticleData() {
    const db = await dbPromise;

    const article = await db.all(SQL`
        select * from article
        `);

    return article;
}



module.exports = {
    retrieveArticleData
}