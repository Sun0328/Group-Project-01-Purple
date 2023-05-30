const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getCommentByArticleId(inputArticleId){
    const db = await dbPromise;

    const articleId = inputArticleId;
    const commentData = await db.all(SQL`
        SELECT c.content, c.time, u.username, c.user_id, c.parent_id, c.id, c.parent_id
        FROM comment c
        JOIN user u ON c.user_id = u.id
        WHERE c.article_id = ${articleId}
        ORDER BY c.time DESC`);
    return commentData;
};


async function addCommentIntoCommentTable(inputSender, inputRcipientCommentId, inputComment, inputArticleId){
    const db = await dbPromise;

    const senderId = inputSender;
    let rcipientCommentId = inputRcipientCommentId;
    const comment = inputComment;
    const articleId = inputArticleId;

    if (rcipientCommentId === null)
    {
        rcipientCommentId = null;
    }

    await db.run(SQL`
        INSERT INTO comment (user_id, parent_id, content, time, article_id)
        VALUES (${senderId}, ${rcipientCommentId}, ${comment}, datetime('now'), ${articleId})`);

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

async function getAllOtherCommentByCommentId(commentId){
    const db = await dbPromise;

    const id = commentId;
    const commentData = await db.all(SQL`
        WITH RECURSIVE comment_tree AS (
            SELECT c.id, c.user_id, c.article_id, c.content, c.time, c.parent_id, u.username
            FROM comment c
            JOIN user u ON c.user_id = u.id
            WHERE c.id = ${id}
            UNION ALL
            SELECT c.id, c.user_id, c.article_id, c.content, c.time, c.parent_id, u.username
            FROM comment c
            JOIN comment_tree ct ON c.parent_id = ct.id
            JOIN user u ON c.user_id = u.id)
        SELECT id, user_id, username, article_id, content, time, parent_id
        FROM comment_tree
        ORDER BY time DESC`);
    return commentData;
}

async function getSenderByCommentId(inputId){
    const db = await dbPromise;
    
    const id = inputId;
    const commentData = await db.get(SQL `
        SELECT user.username
        FROM comment
        JOIN user ON comment.user_id = user.id
        WHERE comment.id = ${id}`);
    return commentData;
}

async function deleCommentByCommentId(inputDeleCommentId){
    const db = await dbPromise;
    
    const deleCommentId = inputDeleCommentId;
    await db.run(SQL `
        WITH RECURSIVE subcomments AS (
            SELECT id FROM comment WHERE id = ${deleCommentId}
            UNION ALL
            SELECT c.id FROM comment c
            INNER JOIN subcomments s ON c.parent_id = s.id)
        DELETE FROM comment WHERE id IN (SELECT id FROM subcomments)`);
}

async function getArticleByCommentId(notificationId){
    const db = await dbPromise;

    const commentId = notificationId;
    const commentData = await db.get(SQL `
        select * from comment
        where id=${commentId}`);
        
    return commentData;
}

module.exports={
    getCommentByArticleId,
    addCommentIntoCommentTable,
    getCommentByCommentId,
    getAllOtherCommentByCommentId,
    getSenderByCommentId,
    deleCommentByCommentId,
    getArticleByCommentId
};