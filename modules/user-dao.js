const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");


async function retrieveAllDataInLikes() {
    const db = await dbPromise;

    const testData = await db.all(SQL`
        select * from likes`);

    return testData;
}

async function getAriticlesByUser(username){
    const db = await dbPromise;
    // get user id from user name
    const user = await db.all(SQL`
        select * from user 
            where username = ${username}
    `);
    // get article array from user id
    const articleArray = await db.all(SQL`
        select * from article 
            where user_id = ${user[0].id}
    `);
    // manually assign user name to article array
    articleArray.forEach(element => {
        element.username = username;
    });
    console.log("Article: "+JSON.stringify(articleArray));
    return articleArray;
}

async function deleteArticleById(id) {
    const db = await dbPromise;
    console.log (id);
    await db.run(SQL`
    delete from article
    where id = ${id};`);
}


module.exports = {
    retrieveAllDataInLikes,
    getAriticlesByUser,
    deleteArticleById
}