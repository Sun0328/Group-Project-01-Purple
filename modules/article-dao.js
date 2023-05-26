const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getAllArticle(){
    const db = await dbPromise;

    const article = await db.all(SQL`
    SELECT a.*, u.username
    FROM article a
    JOIN user u ON a.user_id = u.id
    ORDER BY a.time DESC`);

    console.log(article);
    return article;
}

async function getArticleById(articleId){
    const db = await dbPromise;
    
    const id = articleId;
    const articleData = await db.get(SQL`
        SELECT article.*, user.username
        FROM article
        JOIN user ON article.user_id = user.id
        WHERE article.id = ${id}`);
    return articleData;
}

module.exports={
    getAllArticle,
    getArticleById
}