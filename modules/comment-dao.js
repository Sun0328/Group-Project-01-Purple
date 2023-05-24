const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getCommentByArticleId(inputArticleId){
    const db = await dbPromise;

    const articleId = inputArticleId;
    const commentData = await db.all(SQL`
        SELECT c.content, c.time, u.username, c.user_id
        FROM comment c
        JOIN user u ON c.user_id = u.id
        WHERE c.article_id = ${articleId}
        ORDER BY c.time DESC;`);
    console.log("comment data:" + JSON.stringify(commentData));
    return commentData;
};


async function addCommentIntoCommentTable(inputSender, inputRecipient, inputComment, inputArticleId){
    const db = await dbPromise;

    const senderId = inputSender;
    const recipientId = inputRecipient;
    const comment = inputComment;
    const articleId = inputArticleId;
    
    await db.run(SQL`
        insert into comment(user_id, article_id, content, time, parent_id) 
        values (${senderId}, ${articleId}, ${comment}, datetime('now'), ${recipientId})`);

    const commentData = await db.all(SQL `
        select id from comment`);
    const commentId= commentData.length;

    return commentId;
}

async function getCommentByCommentId(commentId){
    const db = await dbPromise;
    
    const id = commentId;
    const commentData = await db.get(SQL`
        SELECT comment.*, user.username
        FROM comment
        JOIN user ON comment.user_id = user.id
        WHERE comment.id =${id}`);

    return commentData;
}

module.exports={
    getCommentByArticleId,
    addCommentIntoCommentTable,
    getCommentByCommentId
};