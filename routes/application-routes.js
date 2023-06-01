const express = require("express");
const router = express.Router();
// Setup fs
const fs = require("fs");
//add to use salt
const crypto = require('crypto');


//const testDao = require("../modules/test-dao.js");
const userDao = require("../modules/user-dao.js");
const articleDao = require("../modules/article-dao.js");
const commentDao = require("../modules/comment-dao.js");
const likeDao = require("../modules/like-dao.js");
const subscribeDao = require("../modules/subscribe-dao.js");
const notificationDao = require("../modules/notification-dao.js");

//sort array function
const sortMethod = require("../modules/sort.js");
const { log } = require("console");

router.get("/", async function (req, res) {

    res.locals.title = "Purple";
    let articleDataArray = await userDao.retrieveArticleData();
    res.locals.articlesArray = articleDataArray;

    const cookies = req.cookies;


    if (Object.keys(cookies).length > 0) {
        const username = cookies.username;
        const userData = await userDao.getUserByUsername(username);
        const userId = userData.id;
        res.locals.userId = userId;
        const avatar = userData.avatar;

        for (let i = 0; i < articleDataArray.length; i++) {
            const item = articleDataArray[i];
            const articleId = item.id;
            const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

            let likeState;
            if (likeArticle === undefined) {
                likeState = "Like";
            }
            else {
                likeState = "Unlike"
            }
            const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
            const likStateKey = "likeState";
            const likeNumberKey = "likeNumber";

            articleDataArray[i][likStateKey] = likeState;
            articleDataArray[i][likeNumberKey] = likeCount;
        }

        res.locals.articlesArray = articleDataArray;


        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies

        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;


        // For notification
        const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    
        let notReadList = [];
        for (let i = 0; i < allNotificationData.length; i++) {
            const item = allNotificationData[i];
            const hasRead = item.read;
            if (hasRead == 0) {
                notReadList.push(item);
            }
        }

        let NotificationList = [];
        const notificationNum = notReadList.length;
        for (let i = 0; i < notReadList.length; i++) {
            const item = notReadList[i];
            const type = item.type;
            if (type == "comment") {
                const commentId = item.content;

                const commentData = await commentDao.getCommentByCommentId(commentId);
                const content = commentData.content;
                const sender = commentData.username;

                const senderData = await userDao.getUserByUsername(sender);

                // Pass author's avatar
                //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
                const sender_id = senderData.id;
                const avatar = senderData.avatar;
                const articleData = await articleDao.getArticleById(commentData.article_id);
                const articleHeader = articleData.header;
                const title = sender + " send a comment on Article: " + articleHeader;
                const time = commentData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
                NotificationList.push(notification);
            }
            else if (type == "article") {
                const articleId = item.content;
                const articleData = await articleDao.getArticleById(articleId);
                const content = articleData.content;
                const sender = articleData.username;

                const senderData = await userDao.getUserByUsername(sender);
                const avatar = senderData.avatar;
                const title = sender + " published an article";
                const time = articleData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
                NotificationList.push(notification);
            }
            else if (type == "subscribe") {
        
                const beFollowedId = item.receiver_id;
                const beFollowedData = await userDao.getUserByUserId(beFollowedId);
                const beFollowedUsername = beFollowedData.username;
                const sender_id = item.sender_id;
                const subscribeId = item.content;
                const senderData = await userDao.getUserByUserId(sender_id);
                const avatar = senderData.avatar;
                const time = item.time;
                const title = "Newly followed";
                const content = senderData.username + " followed " + beFollowedUsername;
                const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

                NotificationList.push(notification);
            }
        }

        res.locals.notificationNum = notificationNum;
        res.locals.notification = NotificationList;
    }
    else {
        for (let i = 0; i < articleDataArray.length; i++) {
            const item = articleDataArray[i];
            const articleId = item.id;
            const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
            const likeNumberState = "likeState";
            const likeNumberKey = "likeNumber";
            articleDataArray[i][likeNumberKey] = likeCount;
            articleDataArray[i][likeNumberState] = "like Number: ";
        }
        res.locals.articlesArray = articleDataArray;
    }

    res.render("home");
});


router.get("/loginPage", async function (req, res) {
    res.render("login");
});


router.get("/register", async function (req, res) {
    res.render("register");
});

router.get("/testUsername", async function (req, res) {
    const testUsername = req.query.username;
    const userData = await userDao.hasSameUsername(testUsername);
    if (userData === undefined) {
        const message = "unique"
        res.json(message);
    }
    else {
        const message = "same"
        res.json(message);
    }
});

router.post("/signupMessage", async function (req, res) {

    const avatar = req.body.avatar;
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const lastName = req.body.lastName;
    const firstName = req.body.firstName;
    const birth = req.body.birth;
    const description = req.body.description;

    const [year, month, day] = birth.split('-');
    const yearNumber = parseInt(year, 10);
    const monthNumber = parseInt(month, 10);
    const dayNumber = parseInt(day, 10);

    const userData = await userDao.hasSameUsername(username);


    if (password != confirmPassword) {
        const toastMessage = "Inconsistent password input!";
        res.locals.toastMessage = toastMessage;
        res.render("register");
    }
    else if (userData !== undefined) {
        const toastMessage = "Already has the username, please try another!";
        res.locals.toastMessage = toastMessage;
        res.render("register");
    }
    else {
        const InitialUsername = req.body.username;
        const salt = generateSalt();
        const hashedPassword = hashPassword(password, salt);
        const user = {
            "avatar": avatar,
            "username": InitialUsername,
            "password": password,
            "year": yearNumber,
            "month": monthNumber,
            "day": dayNumber,
            "lastName": lastName,
            "firstName": firstName,
            "salt": salt,
            "hashPassword": hashedPassword,
            "description": description
        };
        userDao.createNewUser(user);

        const username = user.username;
        const userData = await userDao.getUserByUsername(username);
        const user_id = userData.id;
        addNewFolder(user_id);

        const toastMessage = "You have successfully registered";
        res.locals.toastMessage = toastMessage;
        res.render("login");
    }
});



router.get("/userHomePage", async function (req, res) {
    // Get user articles by username from cookies
    const cookies = req.cookies;
    const username = cookies.username;

    const userData = await userDao.getUserByUsername(username);
    const avatar = userData.avatar;
    const userId = userData.id;
    res.locals.avatar = avatar;
    const articleList = await articleDao.getAuthorAllArticle(userId);

    let articleDataArray = [];
    for (let i = 0; i < articleList.length; i++) {
        const item = articleList[i];
        const key = "avatar";
        item[key] = avatar;
        articleDataArray.push(item);
    }

    for (let i = 0; i < articleDataArray.length; i++) {
        const item = articleDataArray[i];
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

        let likeState;
        if (likeArticle === undefined) {
            likeState = "Like";
        }
        else {
            likeState = "Unlike"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const likStateKey = "likeState";
        const likeNumberKey = "likeNumber";

        articleDataArray[i][likStateKey] = likeState;
        articleDataArray[i][likeNumberKey] = likeCount;
    }
    res.locals.articles = articleDataArray;

    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;
            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;
            const senderData = await userDao.getUserByUsername(sender);
            // Pass author's avatar
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;
    res.render("userpage");
});

router.post("/deleteArticle", async function (req, res) {

    let articleID = req.body.delete;
    res.locals.articleID = articleID;

    const type = "article";
    await notificationDao.deleNotification(type, articleID);
    await userDao.deleteArticleById(articleID);

    res.redirect("./userHomePage");

});

router.post("/editArticle", async function (req, res) {
    let articleID = JSON.stringify(req.body.edit);
    articleID = articleID.slice(1, -1);
    res.locals.articleID = articleID;
    let article = await userDao.getArticleById(articleID);
    article = article[0];
    res.locals.article = article;

    const folderPath = `./public/uploadedFiles/${article.user_id}`;
    getFileNames(folderPath, function (files) {
        res.locals.files = files;
        res.render("editArticle");
    });
});

router.post("/newArticle", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const userID = await userDao.getUserIdByUserName(username);
    let articleID = await userDao.createNewArticle(userID);
    res.locals.articleID = JSON.stringify(articleID.lastID);
    let article = await userDao.getArticleById(JSON.stringify(articleID.lastID));
    article = article[0];
    res.locals.article = article;

    //notification
    const currentArticleId = articleID.lastID;

    const currentArticle = await articleDao.getArticleById(currentArticleId);
    const currentUser = await userDao.getUserByUsername(username);

    const currentUserId = currentUser.id;
    const subscribeData = await subscribeDao.getSubscribeDataByAuthorId(currentUserId);

    for (let i = 0; i < subscribeData.length; i++) {
        const item = subscribeData[i];
        const receiverId = item.subscriber_id;

        const content = currentArticleId;
        const type = "article";
        const senderId = currentUserId;
        const time = currentArticle.time;
        await notificationDao.addNotification(receiverId, senderId, type, content, time);
    }

    const folderPath = `./public/uploadedFiles/${article.user_id}`;
    getFileNames(folderPath, function (files) {
        res.locals.files = files;
        res.render("editArticle");
    });
});


router.post("/submitChange", async function (req, res) {
    const content = req.body.content;
    let title = req.body.title;
    if (title == "") {
        title = "default title";
    }

    const id = req.body.id;
    await userDao.updateArticletitle(title, id);
    if (content == "") {
        content = "default content";
    }
    let image = req.body.image;
    if (image) {
        await userDao.updateArticleImage(image, id);
    } else if (image == "") {
        await userDao.updateArticleImage(image, id);
    }
    await userDao.updateArticlecontent(content, id);

    res.redirect("/userHomePage");
});

// Sort functions for home page ---------

router.get("/homeSortByTitle", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articleDataArray = await userDao.retrieveArticleData();
    articleDataArray.sort(sortMethod.compareByHeader);


    if (cookie.username == undefined) {
        // Detect if user log in or not
    } else {
        // Get user avatar by username from cookies
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar

        // For notification
        const userId = userData.id;
        const allNotificationData = await notificationDao.getNotificationByUserId(userId);
        let notReadList = [];
        for (let i = 0; i < allNotificationData.length; i++) {
            const item = allNotificationData[i];
            const hasRead = item.read;
            if (hasRead == 0) {
                notReadList.push(item);
            }
        }

        let NotificationList = [];
        const notificationNum = notReadList.length;
        for (let i = 0; i < notReadList.length; i++) {
            const item = notReadList[i];
            const type = item.type;
            if (type == "comment") {
                const commentId = item.content;

                const commentData = await commentDao.getCommentByCommentId(commentId);
                const content = commentData.content;
                const sender = commentData.username;

                const senderData = await userDao.getUserByUsername(sender);

                // Pass author's avatar
                //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
                const sender_id = senderData.id;
                const avatar = senderData.avatar;
                const articleData = await articleDao.getArticleById(commentData.article_id);
                const articleHeader = articleData.header;
                const title = sender + " send a comment on Article: " + articleHeader;
                const time = commentData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
                NotificationList.push(notification);
            }
            else if (type == "article") {
                const articleId = item.content;
                const articleData = await articleDao.getArticleById(articleId);
                const content = articleData.content;
                const sender = articleData.username;

                const senderData = await userDao.getUserByUsername(sender);
                const avatar = senderData.avatar;
                const title = sender + " published an article";
                const time = articleData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
                NotificationList.push(notification);
            }
            else if (type == "subscribe") {
                const beFollowedId = item.receiver_id;
                const beFollowedData = await userDao.getUserByUserId(beFollowedId);
                const beFollowedUsername = beFollowedData.username;
                const sender_id = item.sender_id;
                const subscribeId = item.content;
                const senderData = await userDao.getUserByUserId(sender_id);
                const avatar = senderData.avatar;
                const time = item.time;
                const title = "Newly followed";
                const content = senderData.username + " followed " + beFollowedUsername;
                const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

                NotificationList.push(notification);
            }
        }
        res.locals.notificationNum = notificationNum;
        res.locals.notification = NotificationList;

        if (cookie.username != undefined) {

            // Keep login
            const hasLogin = "has login";
            res.locals.hasLogin = hasLogin;
        }

        for (let i = 0; i < articleDataArray.length; i++) {
            const item = articleDataArray[i];
            const userId = item.user_id;
            const articleId = item.id;
            const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

            let likeState;
            if (likeArticle === undefined) {
                likeState = "Like";
            }
            else {
                likeState = "Unlike"
            }
            const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
            const likStateKey = "likeState";
            const likeNumberKey = "likeNumber";

            articleDataArray[i][likStateKey] = likeState;
            articleDataArray[i][likeNumberKey] = likeCount;
        }
    }

    res.locals.articlesArray = articleDataArray;
    res.render("home");
});

router.get("/homeSortByUsername", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articleDataArray = await userDao.retrieveArticleData();
    articleDataArray.sort(sortMethod.compareByAuthor);

    if (cookie.username == undefined) {
        // Detect if user log in or not
    } else {
        // Get user avatar by username from cookies
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;

        // For notification
        const userId = userData.id;
        const allNotificationData = await notificationDao.getNotificationByUserId(userId);
        let notReadList = [];
        for (let i = 0; i < allNotificationData.length; i++) {
            const item = allNotificationData[i];
            const hasRead = item.read;
            if (hasRead == 0) {
                notReadList.push(item);
            }
        }

        let NotificationList = [];
        const notificationNum = notReadList.length;
        for (let i = 0; i < notReadList.length; i++) {
            const item = notReadList[i];
            const type = item.type;
            if (type == "comment") {
                const commentId = item.content;

                const commentData = await commentDao.getCommentByCommentId(commentId);
                const content = commentData.content;
                const sender = commentData.username;

                const senderData = await userDao.getUserByUsername(sender);

                // Pass author's avatar
                //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
                const sender_id = senderData.id;
                const avatar = senderData.avatar;
                const articleData = await articleDao.getArticleById(commentData.article_id);
                const articleHeader = articleData.header;
                const title = sender + " send a comment on Article: " + articleHeader;
                const time = commentData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
                NotificationList.push(notification);
            }
            else if (type == "article") {
                const articleId = item.content;
                const articleData = await articleDao.getArticleById(articleId);
                const content = articleData.content;
                const sender = articleData.username;

                const senderData = await userDao.getUserByUsername(sender);
                const avatar = senderData.avatar;
                const title = sender + " published an article";
                const time = articleData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
                NotificationList.push(notification);
            }
            else if (type == "subscribe") {
                const beFollowedId = item.receiver_id;
                const beFollowedData = await userDao.getUserByUserId(beFollowedId);
                const beFollowedUsername = beFollowedData.username;
                const sender_id = item.sender_id;
                const subscribeId = item.content;
                const senderData = await userDao.getUserByUserId(sender_id);
                const avatar = senderData.avatar;
                const time = item.time;
                const title = "Newly followed";
                const content = senderData.username + " followed " + beFollowedUsername;
                const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

                NotificationList.push(notification);
            }
        }
        res.locals.notificationNum = notificationNum;
        res.locals.notification = NotificationList;

        if (cookie.username != undefined) {

            // Keep login
            const hasLogin = "has login";
            res.locals.hasLogin = hasLogin;
        }
        for (let i = 0; i < articleDataArray.length; i++) {
            const item = articleDataArray[i];
            const userId = item.user_id;
            const articleId = item.id;
            const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

            let likeState;
            if (likeArticle === undefined) {
                likeState = "Like";
            }
            else {
                likeState = "Unlike"
            }
            const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
            const likStateKey = "likeState";
            const likeNumberKey = "likeNumber";

            articleDataArray[i][likStateKey] = likeState;
            articleDataArray[i][likeNumberKey] = likeCount;
        }
    }

    res.locals.articlesArray = articleDataArray;
    res.render("home");
});

router.get("/homeSortByDate", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articleDataArray = await userDao.retrieveArticleData();
    articleDataArray.sort(sortMethod.compareByDate);

    if (cookie.username == undefined) {
        // Detect if user log in or not
    } else {
        // Get user avatar by username from cookies
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;

        // For notification
        const userId = userData.id;
        const allNotificationData = await notificationDao.getNotificationByUserId(userId);
        let notReadList = [];
        for (let i = 0; i < allNotificationData.length; i++) {
            const item = allNotificationData[i];
            const hasRead = item.read;
            if (hasRead == 0) {
                notReadList.push(item);
            }
        }

        let NotificationList = [];
        const notificationNum = notReadList.length;
        for (let i = 0; i < notReadList.length; i++) {
            const item = notReadList[i];
            const type = item.type;
            if (type == "comment") {
                const commentId = item.content;

                const commentData = await commentDao.getCommentByCommentId(commentId);
                const content = commentData.content;
                const sender = commentData.username;

                const senderData = await userDao.getUserByUsername(sender);

                // Pass author's avatar
                //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
                const sender_id = senderData.id;
                const avatar = senderData.avatar;
                const articleData = await articleDao.getArticleById(commentData.article_id);
                const articleHeader = articleData.header;
                const title = sender + " send a comment on Article: " + articleHeader;
                const time = commentData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
                NotificationList.push(notification);
            }
            else if (type == "article") {
                const articleId = item.content;
                const articleData = await articleDao.getArticleById(articleId);
                const content = articleData.content;
                const sender = articleData.username;

                const senderData = await userDao.getUserByUsername(sender);
                const avatar = senderData.avatar;
                const title = sender + " published an article";
                const time = articleData.time;
                const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
                NotificationList.push(notification);
            }
            else if (type == "subscribe") {
                const beFollowedId = item.receiver_id;
                const beFollowedData = await userDao.getUserByUserId(beFollowedId);
                const beFollowedUsername = beFollowedData.username;
                const sender_id = item.sender_id;
                const subscribeId = item.content;
                const senderData = await userDao.getUserByUserId(sender_id);
                const avatar = senderData.avatar;
                const time = item.time;
                const title = "Newly followed";
                const content = senderData.username + " followed " + beFollowedUsername;
                const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

                NotificationList.push(notification);
            }
        }
        res.locals.notificationNum = notificationNum;
        res.locals.notification = NotificationList;

        if (cookie.username != undefined) {

            // Keep login
            const hasLogin = "has login";
            res.locals.hasLogin = hasLogin;

        }
        for (let i = 0; i < articleDataArray.length; i++) {
            const item = articleDataArray[i];
            const userId = item.user_id;
            const articleId = item.id;
            const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

            let likeState;
            if (likeArticle === undefined) {
                likeState = "Like";
            }
            else {
                likeState = "Unlike"
            }
            const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
            const likStateKey = "likeState";
            const likeNumberKey = "likeNumber";

            articleDataArray[i][likStateKey] = likeState;
            articleDataArray[i][likeNumberKey] = likeCount;
        }
    }

    res.locals.articlesArray = articleDataArray;
    res.render("home");

});

router.get("/homeResetSort", async function (req, res) {
    res.redirect("/");
});

// Sort functions for user page -----------

router.get("/sortByTitle", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articles = await userDao.getAriticlesByUser(username);
    articles.sort(sortMethod.compareByHeader);

    // Get user avatar by username from cookies
    const userData = await userDao.getUser(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;


    for (let i = 0; i < articles.length; i++) {
        const item = articles[i];
        const userId = item.user_id;
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

        let likeState;
        if (likeArticle === undefined) {
            likeState = "Like";
        }
        else {
            likeState = "Unlike"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const likStateKey = "likeState";
        const likeNumberKey = "likeNumber";

        articles[i][likStateKey] = likeState;
        articles[i][likeNumberKey] = likeCount;
    }

    res.locals.articles = articles;

    res.render("userpage");
});

router.get("/sortByDate", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articles = await userDao.getAriticlesByUser(username);
    articles.sort(sortMethod.compareByDate);

    for (let i = 0; i < articles.length; i++) {
        const item = articles[i];
        const userId = item.user_id;
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

        let likeState;
        if (likeArticle === undefined) {
            likeState = "Like";
        }
        else {
            likeState = "Unlike"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const likStateKey = "likeState";
        const likeNumberKey = "likeNumber";

        articles[i][likStateKey] = likeState;
        articles[i][likeNumberKey] = likeCount;
    }
    res.locals.articles = articles;


    // Get user avatar by username from cookies
    const userData = await userDao.getUser(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    res.locals.articles = articles;

    res.render("userpage");
});

router.get("/resetSort", async function (req, res) {
    res.redirect("/userHomePage");
});

// Sorting ends ------------------------------


router.post("/login", async function (req, res) {
    const username = req.body.username;
    const inputPassword = req.body.password;

    const hasUsername = await userDao.getUser(username);
    if (hasUsername == undefined) {
        const toastMessage = "Has no such user or enter the wrong username!";
        res.locals.toastMessage = toastMessage;
        res.status(401);
        res.render("login");
    }
    else {
        const saltObjectData = await userDao.getSalt(username);
        const salt = saltObjectData.salt;

        const rightHashedPasswordData = await userDao.getPassword(username);
        const rightHashedPassword = rightHashedPasswordData.password;

        const hashedInputPassword = hashPassword(inputPassword, salt);
        if (hashedInputPassword == rightHashedPassword) {
            const cookieName = "authToken";
            const cookieValue = hashedInputPassword;
            res.cookie(cookieName, cookieValue);
            res.cookie("username", username);

            const toastMessage = "Welcome, " + `${username}` + "!";
            res.locals.toastMessage = toastMessage;

            res.locals.articles = await userDao.getAriticlesByUser(username);
            res.locals.username = username;

            if (req.body.delete) {
                console.log("receive delete query");
            } else {
                const username = req.body.username;
                res.locals.articles = await userDao.getAriticlesByUser(username);
                res.locals.username = username;
            }

            // Back to home page After login
            res.status(204);
            res.redirect("/");
        }
        else {
            const toastMessage = "Wrong Password!";
            res.locals.toastMessage = toastMessage;
            res.status(401);
            res.render("login");
        }
    }
});

router.get("/setting", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const userData = await userDao.getUserByUsername(username);
    let toastMessage;
    if (req.query.toastMessage != undefined){
        toastMessage = req.query.toastMessage}
    else{
        toastMessage = null;
    }
    res.locals.birth = userData.year + " / " + userData.month + " / " + userData.day;
    res.locals.toastMessage = toastMessage;
    res.locals.userCurrentData = userData;
    res.render("setting");
});



router.get("/logout", async function (req, res) {
    Object.keys(req.cookies).forEach(cookieName => {
        res.clearCookie(cookieName);
    });
    const toastMessage = "Successfully logged out!";
    res.locals.toastMessage = toastMessage;
    res.status(204);
    res.redirect("loginPage");
});

router.post("/changeUsername", async function (req, res) {
    const newUsername = req.body.username;

    const cookies = req.cookies;
    const oldUsername = cookies.username;

    const userData = await userDao.hasSameUsername(newUsername);

    if (userData === undefined) {
        await userDao.changeUsername(oldUsername, newUsername);

        res.cookie("username", newUsername);

        const toastMessage = "Successfully change the username!";
        res.redirect(`/setting?toastMessage=${toastMessage}`);
    }
    else {
        const toastMessage = "The username already exists!";
        req.session.toastMessage = toastMessage;
        res.redirect(`/setting?toastMessage=${toastMessage}`);
    }
});


router.post("/changeAvatar", async function (req, res) {
    const newAvatar = req.body.avatar;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeAvatar(username, newAvatar);

    const toastMessage = "Successfully change the Avatar!";
    res.locals.toastMessage = toastMessage;
    res.redirect(`/setting?toastMessage=${toastMessage}`);
});

router.post("/changeLastName", async function (req, res) {
    const newLastName = req.body.lastName;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeLastName(username, newLastName);

    const toastMessage = "Successfully change the Last Name!";
    res.locals.toastMessage = toastMessage;
    res.redirect(`/setting?toastMessage=${toastMessage}`);
});

router.post("/changeFirstName", async function (req, res) {
    const newFirstName = req.body.firstName;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeFirstName(username, newFirstName);

    const toastMessage = "Successfully change the First Name!";
    res.locals.toastMessage = toastMessage;
    res.redirect(`/setting?toastMessage=${toastMessage}`);
});

router.post("/changeBirth", async function (req, res) {
    const newBirth = req.body.birth;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeBirth(username, newBirth);
    const toastMessage = "Successfully change the Date of Birth!";
    res.locals.toastMessage = toastMessage;
    res.redirect(`/setting?toastMessage=${toastMessage}`);
})


router.post("/changeBirth", async function (req, res) {
    const newBirth = req.body.birth;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeBirth(username, newBirth);

    const toastMessage = "Successfully change the Birth Day";
    res.locals.toastMessage = toastMessage;
    res.redirect(`/setting?toastMessage=${toastMessage}`);
});


router.post("/changeDescription", async function (req, res) {
    const newDescription = req.body.description;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeDescription(username, newDescription);

    const toastMessage = "Successfully change the Description";
    res.locals.toastMessage = toastMessage;
    res.redirect(`/setting?toastMessage=${toastMessage}`);
})


router.post("/delete", async function (req, res) {
    const cookies = req.cookies;
    const username = cookies.username;

    const user = await userDao.getUserByUsername(username);
    const user_id = user.id;
    deleteFolder(JSON.stringify(user_id));

    res.clearCookie("authToken");
    res.clearCookie("username");
    await userDao.deleteTheUser(username);

    const toastMessage = "Successfully deleted account!";
    res.locals.toastMessage = toastMessage;
    res.redirect("/");
})



router.get("/article", async function (req, res) {
    // Get user avatar by username from cookies
    const cookies = req.cookies;
    const username = cookies.username;
    const userData = await userDao.getUserByUsername(username);

    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;
    // -----------------------------

    const articleId = req.query.id;

    const articleData = await articleDao.getArticleById(articleId);
    res.locals.articleData = articleData;

    const header = articleData.header;
    const author = (await userDao.getAuthor(articleData.user_id)).username;
    const time = articleData.time;
    const content = articleData.content;
    const img = articleData.image;
    const author_data = await userDao.getUserByUsername(author);
    const author_id = author_data.id;
    res.locals.header = header;
    res.locals.author = author;
    res.locals.time = time;
    res.locals.content = content;
    res.locals.articleId = articleId;
    res.locals.authorId = author_id;
    res.locals.image = img;

    const allCommentData = await commentDao.getCommentByArticleId(articleId);

    let firstLevelCommentData = [];
    let s_t_o_ChildrenCommentData = [];
    let t_o_ChildrenCommentData = [];
    let o_ChildrenCommentData = [];

    let secondLevelCommentData = [];
    let thirdLevelCommentData = [];
    let otherLevelCommentData = [];

    for (let i = 0; i < allCommentData.length; i++) {
        const item = allCommentData[i];
        const parentId = item.parent_id;
        if (parentId === null) {
            const comment = { "comment_id": item.id, "sender": item.username, "recipient": author, "content": item.content, "time": item.time, "nextLevelComment": [] }
            firstLevelCommentData.push(comment);
        }
        else {
            const comment = { "comment_id": item.id, "parent_id": parentId, "sender": item.username, "recipient": null, "content": item.content, "time": item.time, "nextLevelComment": [] }
            s_t_o_ChildrenCommentData.push(comment);
        }
    }

    for (let i = 0; i < s_t_o_ChildrenCommentData.length; i++) {
        const child = s_t_o_ChildrenCommentData[i];
        const parentId = child.parent_id;
        for (let j = 0; j < firstLevelCommentData.length; j++) {
            const parent = firstLevelCommentData[j];
            const id = parent.comment_id;
            if (parentId === id) {
                child.recipient = parent.sender;
                parent.nextLevelComment.push(child);
                secondLevelCommentData.push(child);
            }
            else {
                if (t_o_ChildrenCommentData.indexOf(child) === -1) {
                    t_o_ChildrenCommentData.push(child);
                }

            }
        }
    }

    for (let i = 0; i < t_o_ChildrenCommentData.length; i++) {
        const child = t_o_ChildrenCommentData[i];
        const parentId = child.parent_id;
        for (let j = 0; j < secondLevelCommentData.length; j++) {
            const secondLevelComment = secondLevelCommentData[j];
            const id = secondLevelComment.comment_id;
            if (parentId === id) {
                child.recipient = secondLevelComment.sender;
                secondLevelComment.nextLevelComment.push(child);
                thirdLevelCommentData.push(child);
            }
            else {
                if (o_ChildrenCommentData.indexOf(child) === -1) {
                    o_ChildrenCommentData.push(child);
                }
            }
        }
    }
    for (let i = 0; i < thirdLevelCommentData.length; i++) {
        const thirdComment = thirdLevelCommentData[i];
        const thirdCommentId = thirdComment.comment_id;
        const otherCommentData = await commentDao.getAllOtherCommentByCommentId(thirdCommentId);

        for (let j = 0; j < otherCommentData.length; j++) {
            const item = otherCommentData[j];
            if (item.id != thirdCommentId) {
                const parentId = item.parent_id;
                const recipient = (await commentDao.getSenderByCommentId(parentId)).username;
                const otherComment = { "comment_id": item.id, "sender": item.username, "recipient": recipient, "content": item.content, "time": item.time, "nextLevelComment": [] }
                otherLevelCommentData.push(otherComment);
                thirdComment.nextLevelComment.push(otherComment);
            }
        }
    }

    res.locals.firstLevelCommentData = firstLevelCommentData;

    // For notification
    const userId = userData.id;

    // For notification
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;
            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;
            const senderData = await userDao.getUserByUsername(sender);
            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    res.render("articlePage");
});

router.get("/article/comment", async function (req, res) {
    const commentContent = req.query.commentContent;
    const articleId = req.query.articleId;
    const recipientCommentId = req.query.recipientCommentId;
    const cookies = req.cookies;
    const sender = cookies.username;

    const userData = await userDao.getUserByUsername(sender);
    const senderId = userData.id;

    const commentId = await commentDao.addCommentIntoCommentTable(senderId, recipientCommentId, commentContent, articleId);
    const commentData = await commentDao.getCommentByCommentId(commentId);

    const subscribeData = await subscribeDao.getSubscribeDataByAuthorId(senderId);
    for (let i = 0; i < subscribeData.length; i++) {
        const item = subscribeData[i];
        const receiverId = item.subscriber_id;
        const type = "comment";
        const content = commentId;
        const time = commentData.time;

        await notificationDao.addNotification(receiverId, senderId, type, content, time);
    }
    res.json(commentData);
});

router.get("/article/deleComment", async function (req, res) {
    const deleCommentId = req.query.deleCommentId;
    await commentDao.deleCommentByCommentId(deleCommentId);
    res.json();
});

router.get("/goNotificationDetail", async function (req, res) {
    const username = req.query.userId;
    const notificationType = req.query.type;
    const notificationTypeId = req.query.content;
    const notificationId = req.query.notificationId;
    if (notificationType == "comment") {
        const articleData = await commentDao.getArticleByCommentId(notificationTypeId);
        const articleId = articleData.article_id;
        await notificationDao.changeNotificationReadStateById(notificationId);
        res.redirect(`./article?id=${articleId}`);
    }
    else if (notificationType == "article") {
        const articleId = notificationTypeId;
        await notificationDao.changeNotificationReadStateById(notificationId);
        res.redirect(`./article?id=${articleId}`);
    }
    else if (notificationType == "subscribe") {
        const subscribeId = notificationTypeId;
        const subscribeData = await subscribeDao.getSubscribeDataBySubscribeId(subscribeId);
        const FollowerId = subscribeData.subscriber_id;
        const FollowerData = await userDao.getUserByUserID(FollowerId);
        const FollowerName = FollowerData.username;
        await notificationDao.changeNotificationReadStateById(notificationId);
        res.redirect(`./subscription/subscriber?name=${FollowerName}`);
    }

});


router.get("/addLike", async function (req, res) {
    const articleId = req.query.articleId;

    const cookies = req.cookies;
    const username = cookies.username;

    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;

    await likeDao.addLike(userId, articleId);

    res.json("add like");
})

router.get("/cancelLike", async function (req, res) {
    const articleId = req.query.articleId;

    const cookies = req.cookies;
    const username = cookies.username;

    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;

    await likeDao.deleLike(userId, articleId);

    res.json("dele like");

})


const generateSalt = function () {
    const salt = crypto.randomBytes(16);
    return salt.toString('hex');
};

const hashPassword = function (password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

function addNewFolder(user_id) {
    const folderName = `./public/uploadedFiles/${user_id}`;
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    } catch (err) {
        console.error(err);
    }
}

function getFileNames(folderPath, callback) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        callback(files);
    })
}

router.get("/subscription", async function (req, res) {
    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;
    // Get user avatar by username from cookies
    const userData = await userDao.getUser(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;
    const authors = await userDao.getAuthorsByUserName(username);
    res.locals.authors = authors;
    const subscribers = await userDao.getSubscribersByUserName(username);
    res.locals.subscribers = subscribers;

    // For notification
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;
            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;
            const senderData = await userDao.getUserByUsername(sender);
            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    res.render("subscription");
});

router.get("/subscription/author", async function (req, res) {
    const author_name = req.query.name;
    // get author username
    res.locals.author = author_name;

    // get author profile by author name
    let profile = await userDao.getProfileByName(author_name);

    profile = (JSON.stringify(profile[0].profile))
    profile = profile.slice(1, -1);
    res.locals.profile = profile;

    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;

    // do a check to check whether user are still following author
    const result = await userDao.checkSubscription(username, author_name);

    // do a check to check whether subscriber are still following user
    const followresult = await userDao.checkSubscription(author_name, username);

    const authorData = await userDao.getUserByUsername(author_name);
    const profileAvatar = authorData.avatar;
    res.locals.profileAvatar = profileAvatar;

    const authorId = authorData.id;
    const authorArticleList = await articleDao.getAuthorAllArticle(authorId);
    let articleDataArray = [];
    for (let i = 0; i < authorArticleList.length; i++) {
        const item = authorArticleList[i];
        const key = "avatar";
        item[key] = profileAvatar;
        articleDataArray.push(item);
    }

    for (let i = 0; i < articleDataArray.length; i++) {
        const item = articleDataArray[i];
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(authorId, articleId);

        let likeState;
        if (likeArticle === undefined) {
            likeState = "Like";
        }
        else {
            likeState = "Unlike"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const likStateKey = "likeState";
        const likeNumberKey = "likeNumber";

        articleDataArray[i][likStateKey] = likeState;
        articleDataArray[i][likeNumberKey] = likeCount;
    }
    res.locals.articles = articleDataArray;

    const userData = await userDao.getUserByUsername(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification-----------------------------
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    if (username !== author_name) {
        res.locals.NotSameUser = 1;
    }
    if (result == 1) {
        res.locals.subscribe = result;
    }
    if (followresult == 1){
        res.locals.follow = followresult;
    }
    
    res.render("profile");
})

router.get("/subscription/subscriber", async function (req, res) {
    const subscriber_name = req.query.name;
    // get subscriber username
    res.locals.subscriber = subscriber_name;

    // get subscriber profile by subscriber name
    const subscriberData = await userDao.getUserByUsername(subscriber_name);
    const profile = subscriberData.profile;
    res.locals.profile = profile;

    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;

    // do a check to check whether user are still following author
    const result = await userDao.checkSubscription(subscriber_name, username);

    // do a check to check whether user are still following author
    const subscriberesult = await userDao.checkSubscription(username, subscriber_name);

    const subscriberId = subscriberData.id;
    const profileAvatar = subscriberData.avatar;
    res.locals.profileAvatar = profileAvatar;
    const userData = await userDao.getUserByUsername(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification-----------------------------
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };


            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    const subscriberArticleList = await articleDao.getAuthorAllArticle(subscriberId);
    let articleDataArray = [];
    for (let i = 0; i < subscriberArticleList.length; i++) {
        const item = subscriberArticleList[i];
        const key = "avatar";
        item[key] = profileAvatar;
        articleDataArray.push(item);
    }

    for (let i = 0; i < articleDataArray.length; i++) {
        const item = articleDataArray[i];
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(subscriberId, articleId);

        let likeState;
        if (likeArticle === undefined) {
            likeState = "Like";
        }
        else {
            likeState = "Unlike"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const likStateKey = "likeState";
        const likeNumberKey = "likeNumber";

        articleDataArray[i][likStateKey] = likeState;
        articleDataArray[i][likeNumberKey] = likeCount;
    }
    res.locals.articles = articleDataArray;



    if (username !== subscriber_name) {
        res.locals.NotSameUser = 1;
    }
    if (result == 1) {
        res.locals.follow = result;
    }
    if (subscriberesult == 1) {
        res.locals.subscribe = subscriberesult;
    }

    res.render("profile");
})

router.get("/subscription/subscribe", async function (req, res) {
    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;

    if (req.query.author) {
        const author = req.query.author;
        const subscriber = username;

        // add to subscribe table
        const testResult = await userDao.createNewSubscribe(subscriber, author);
        const subscribe_id = JSON.stringify(testResult.lastID);


        // add notification to notify the author
        let senderId = await userDao.getUserIdByUserName(subscriber);
        senderId = JSON.stringify(senderId.id);

        let receiverId = await userDao.getUserIdByUserName(author);
        receiverId = JSON.stringify(receiverId.id);

        const type = "subscribe";
        const content = subscribe_id;
        const time = await userDao.getTimeBySubscribeID(subscribe_id);

        await notificationDao.addNotification(receiverId, senderId, type, content, time);
    }
    const author_name = req.query.author;
    // get author username
    res.locals.author = author_name;

    // get author profile by author name
    const authorData = await userDao.getUserByUsername(author_name);
    const profile = authorData.profile;
    res.locals.profile = profile;
    const author_id = authorData.id;
    const profileAvatar = authorData.avatar;
    res.locals.profileAvatar = profileAvatar;

    const articles = await userDao.getAriticlesByUser(author_name);
    res.locals.articles = articles;

    const userData = await userDao.getUserByUsername(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification-----------------------------
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;


    // do a check to check whether user are still following author
    const result = await userDao.checkSubscription(username, author_name);
    // do a check to check whether user are still following author
    const result2 = await userDao.checkSubscription(author_name, username);

    if (username !== author_name) {
        res.locals.NotSameUser = 1;
    }
    if (result == 1) {
        res.locals.subscribe = result;
    }
    if (result2 == 1){
        res.locals.follow = result2;
    }
    res.render("profile");

})

router.get("/subscription/unsubscribe", async function (req, res) {
    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;

    // For notification-----------------------------
    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;


    // If you are subscriber
    if (req.query.author) {
        const author = req.query.author;
        const subscriber = username;

        // delete subscribe table
        const subscribe_id = await userDao.getSubscribeId(author, subscriber);
        const testResult = await userDao.deleteSubscribe(subscriber, author);
        await notificationDao.deleNotification("subscribe", subscribe_id);
        const author_name = req.query.author;
        // set subscriber username
        res.locals.author = author_name;

        // set author profile by author_name
        const authorData = await userDao.getUserByUsername(author_name);
        const profile = authorData.profile;
        res.locals.profile = profile;

        // do a check to check whether subscriber is still following author
        const result = await userDao.checkSubscription(username, author_name);

        const result2 = await userDao.checkSubscription(author_name, username);

        const avatar = authorData.avatar;
        res.locals.profileAvatar = avatar;

        const articles = await userDao.getAriticlesByUser(author_name);
        res.locals.articles = articles;

        const userData = await userDao.getUserByUsername(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;

        if (username !== author_name) {
            res.locals.NotSameUser = 1;
        }
        if (result == 1) {
            res.locals.subscribe = result;
        }
        if (result2 == 1){
            res.locals.follow = result2;
        }
        res.render("profile");
    }// If you are author
    else {
        const author = username;
        const subscriber = req.query.subscriber;
        // delete subscribe table
        const testResult = await userDao.deleteSubscribe(subscriber, author);
        const subscribe_id = JSON.stringify(testResult.lastID);
        const subscriber_name = req.query.subscriber;
        // set subscriber username
        res.locals.subscriber = subscriber;

        // set author profile by author_name
        const subscriberData = await userDao.getUserByUsername(subscriber);
        const profile = subscriberData.profile;
        res.locals.profile = profile;

        const profileAvatar = subscriberData.avatar;
        res.locals.profileAvatar = profileAvatar;

        const articles = await userDao.getAriticlesByUser(subscriber);
        res.locals.articles = articles;

        const userData = await userDao.getUserByUsername(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;

        // do a check to check whether subscriber is still following author
        const result = await userDao.checkSubscription(subscriber, username);

        // do a check to check whether subscriber is still following author
        const result2 = await userDao.checkSubscription(username, subscriber);

        if (username !== subscriber) {
            res.locals.NotSameUser = 1;
        }
        if (result == 1) {
            res.locals.follow = result;
        }
        if (result2 == 1){
            res.locals.subscribe = result2;
        }
        res.render("profile");
    }
})

router.get("/favorite", async function (req, res) {
    // Get user favorite articles by username from cookies
    const cookies = req.cookies;
    const username = cookies.username;
    // Get user id

    const userData = await userDao.getUserByUsername(username);
    const user_id = userData.id;

    // Get user avatar by username from cookies
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification
    const userId = userData.id;
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;
            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;
            const sender_id = commentData.id;
            // Pass author's avatar
            const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const avatar = sender_avatar[0].avatar;
            const articleData = await articleDao.getArticleById(commentData.id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "title": title, "content": content, "author": sender, "avatar": avatar, "time": time };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;
            // Pass author's avatar
            const sender_id = await userDao.getUserIdByUserName(sender);
            const sender_avatar = await userDao.getAvatarByUserId(sender_id.id);
            const avatar = sender_avatar[0].avatar;

            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "title": title, "content": content, "author": sender, "avatar": avatar, "time": time };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    // get user liked article list
    // get user liked article list
    const like_list = await userDao.getLikesByUserId(user_id);
    let articleDataArray = [];
    for (let i = 0; i < like_list.length; i++) {
        const item = like_list[i];
        const currentArticleId = item.article_id;
        const currentArticleData = await articleDao.getArticleById(currentArticleId);
        const currentAuthorId = currentArticleData.user_id;
        const authorData = await userDao.getUserByUserId(currentAuthorId);
        const authorAvatar = authorData.avatar;
        const key = "avatar";
        currentArticleData[key] = authorAvatar;
        articleDataArray.push(currentArticleData);
    }

    for (let i = 0; i < articleDataArray.length; i++) {
        const item = articleDataArray[i];
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);

        let likeState;
        if (likeArticle === undefined) {
            likeState = "Like";
        }
        else {
            likeState = "Unlike"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const likStateKey = "likeState";
        const likeNumberKey = "likeNumber";

        articleDataArray[i][likStateKey] = likeState;
        articleDataArray[i][likeNumberKey] = likeCount;
    }
    res.locals.articles = articleDataArray;

    res.render("favorite");
});


function deleteFolder(user_id) {
    const path = `./public/uploadedFiles/${user_id}`;
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


router.get("/analytics", async function (req, res) {
    const cookies = req.cookies;
    const username = cookies.username;
    res.locals.currentUser = username;
    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;

    // Get user avatar
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification-----------------------------
    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) {
        const item = allNotificationData[i];
        const hasRead = item.read;
        if (hasRead == 0) {
            notReadList.push(item);
        }
    }

    let NotificationList = [];
    const notificationNum = notReadList.length;
    for (let i = 0; i < notReadList.length; i++) {
        const item = notReadList[i];
        const type = item.type;
        if (type == "comment") {
            const commentId = item.content;

            const commentData = await commentDao.getCommentByCommentId(commentId);
            const content = commentData.content;
            const sender = commentData.username;

            const senderData = await userDao.getUserByUsername(sender);

            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": commentId };
            NotificationList.push(notification);
        }
        else if (type == "article") {
            const articleId = item.content;
            const articleData = await articleDao.getArticleById(articleId);
            const content = articleData.content;
            const sender = articleData.username;

            const senderData = await userDao.getUserByUsername(sender);
            const avatar = senderData.avatar;
            const title = sender + " published an article";
            const time = articleData.time;
            const notification = { "id": item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type": type, "typeId": articleId };
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            const beFollowedId = item.receiver_id;
            const beFollowedData = await userDao.getUserByUserId(beFollowedId);
            const beFollowedUsername = beFollowedData.username;
            const sender_id = item.sender_id;
            const subscribeId = item.content;
            const senderData = await userDao.getUserByUserId(sender_id);
            const avatar = senderData.avatar;
            const time = item.time;
            const title = "Newly followed";
            const content = senderData.username + " followed " + beFollowedUsername;
            const notification = { "id": item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type": type, "typeId": subscribeId };

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;


    // For Top3
    const topNumber = 3;

    const subscribeData = await subscribeDao.getSubscribeDataByAuthorId(userId);
    const followerNumber = subscribeData.length;
    res.locals.followerNumber = followerNumber;

    const articleData = await articleDao.getAuthorAllArticle(userId);
    const articleNumber = articleData.length;
    let commentNumber = 0;
    let likeNumber = 0;

    let popularIndexList = [];
    for (let i = 0; i < articleNumber; i++) {

        const item = articleData[i];
        const articleId = item.id;
        const currentArticleCommentData = await commentDao.getCommentByArticleId(articleId);
        const currentArticleCommentNumber = currentArticleCommentData.length;

        const currentArticleLikeNumber = await likeDao.getLikeNumberByArticleId(articleId);

        commentNumber = commentNumber + currentArticleCommentNumber;
        likeNumber = likeNumber + currentArticleLikeNumber;

        const popularIndex = currentArticleCommentNumber * 2 + currentArticleLikeNumber;
        item["popularIndex"] = popularIndex;
        item["likeNumber"] = currentArticleLikeNumber;
        item["commentNumber"] = currentArticleCommentNumber;
        if (popularIndex == 0) {
            item["hasPopularIndex"] = false;
            popularIndexList.push(item);
        }
        else {
            item["hasPopularIndex"] = true;
            popularIndexList.push(item);
        }
    }
    res.locals.allCommentNumber = commentNumber;
    res.locals.allLikeNumber = likeNumber;

    for (let i = 0; i < popularIndexList.length; i++)
    {
        const currentArticle = popularIndexList[i];
        const currentArticleIndex = currentArticle.popularIndex;
        for (let j = i + 1; j < popularIndexList.length; j++)
        {
            const nextArticle = popularIndexList[j];
            const nextArticleIndex = nextArticle.popularIndex;
            if (nextArticleIndex > currentArticleIndex)
            {
                const temp = popularIndexList[i];
                popularIndexList[i] = popularIndexList[j];
                popularIndexList[j] = temp;
            }
        }
    }

    if (articleNumber >= topNumber) {
        let mostPopularArticleList = [];
        for (let i = 0; i < topNumber; i++) {
            const item = popularIndexList[i];
            const key = "rank";
            item[key] = i + 1;
            mostPopularArticleList.push(item);
        }
        res.locals.mostPopularArticleList = mostPopularArticleList;
    }
    else if (articleNumber > 0 && articleNumber < topNumber) {
        let mostPopularArticleList = [];
        for (let i = 0; i < popularIndexList.length; i++) {
            const item = popularIndexList[i];
            const key = "rank";
            item[key] = i + 1;
            mostPopularArticleList.push(item);

        }
        res.locals.mostPopularArticleList = mostPopularArticleList;
    }
    else if (articleNumber == 0) {
        const noArticle = "has no article";
        res.locals.noArticle = noArticle;
    }

    res.render("analytics");
})

router.get("/analyticsChart", async function (req, res) {
    const allCommentData = await commentDao.getAllCommentData();
    const today = new Date();
    const dayLength = 10;

    let chartData = [];
    for (let i = dayLength - 1; i >= 0; i--) {
        let counter = 0;
        const currentDay = new Date(today).setDate(today.getDate() - i);
        const currentDayAfterFormat = formatDate(currentDay);
        for (let j = 0; j < allCommentData.length; j++) {
            const item = allCommentData[j];
            const commentTimeString = item.time;

            const commentTime = YMDformat(commentTimeString);
            if (commentTime == currentDayAfterFormat) {
                counter = counter + 1;
            }
        }
        const currentCommentNumberData = { "data": currentDayAfterFormat, "count": counter };

        chartData.push(currentCommentNumberData);
    }
    res.json(chartData);
});


function formatDate(date) {
    if (typeof date === "number") {
        date = new Date(date);
    }

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
        month = "0" + month;
    }

    if (day < 10) {
        day = "0" + day;
    }

    return year + "-" + month + "-" + day;
}

function YMDformat(dateStr) {
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 注意月份从0开始，需要加1
    const day = dateObj.getDate();

    const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    return formattedDate;
}

router.get("/users", async function (req, res) {

    const cookies = req.cookies;
    if (Object.keys(cookies).length > 0) {
        const username = cookies.username;
        res.locals.currentUser = username;
        const userData = await userDao.getUserByUsername(username);
        if (userData.admin == 1) {
            const users = await userDao.getAllUser();
            res.locals.users = users;
            res.render("users");
        } else {
            res.status(401);
        }
    } else {
        res.status(401);
    }
});



router.delete("/users/:id", async function (req, res) {
    const cookies = req.cookies;
    if (Object.keys(cookies).length > 0) {
        const username = cookies.username;
        res.locals.currentUser = username;
        const userData = await userDao.getUserByUsername(username);
        if (userData.admin == 1) {
            const deleteUserId = req.params.userId;
            const deleteUser = await userDao.getUserByUserID(deleteUserId);
            if (userData.username !== deleteUser.username) {
                await userDao.deleteTheUser(deleteUser.username);
                res.status(204);
                res.redirect("users");
            }
        }
    } else {
        res.status(401);
    }
});

router.post("/newImage", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const userID = await userDao.getUserIdByUserName(username);
    res.locals.user_id = JSON.stringify(userID.id);
    res.render("uploadImage");
})

module.exports = router;