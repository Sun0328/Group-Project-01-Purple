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
    console.log("articleDataArray---" + JSON.stringify(articleDataArray));
    res.locals.articlesArray = articleDataArray;

    const cookies = req.cookies;
    console.log("cookies: " + JSON.stringify(cookies));

    if (Object.keys(cookies).length > 0) {
        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies
        const username = cookies.username;
        const userData = await userDao.getUserByUsername(username);
        console.log("userData: " + JSON.stringify(userData));

        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;


        // For notification
        const userId = userData.id;
        const allNotificationData = await notificationDao.getNotificationByUserId(userId);
        // console.log("allNotificationData--" + JSON.stringify(allNotificationData));
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
                const beFollowedId = item.content;
                const beFollowedUsername = await userDao.getUserByUserId(beFollowedId);
                const sender = item.sender;
                // Pass author's avatar
                const sender_id = await userDao.getUserIdByUserName(sender);
                const sender_avatar = await userDao.getAvatarByUserId(sender_id.id);
                const avatar = sender_avatar[0].avatar;

                const title = "Newly followed"
                const content = sender + " followed " + beFollowedUsername;
                const notification = { "title": title, "content": content, "author": sender, "avatar": avatar, "time": time };
                NotificationList.push(notification);
            }
        }
        res.locals.notificationNum = notificationNum;
        res.locals.notification = NotificationList;

    }

    res.render("home");
});

router.get("/go", async function (req, res) {
    const cookies = req.cookies;
    const username = cookies.username;

    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;

    let articleList = [];
    const articleData = await articleDao.getAllArticle();
    for (let i = 0; i < articleData.length; i++) {
        const item = articleData[i];
        const articleId = item.id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(userId, articleId);
        let likeState;
        if (likeArticle === undefined)
        {
            likeState = "Like";
        }
        else
        {
            likeState = "cancel Like"
        }
        const likeCount = await likeDao.getLikeNumberByArticleId(articleId);
        const key = "likeNumber";
        articleData[i][key] = likeCount;
        const articleItem = {"id":item.id, "header": item.header,"content": item.content, "author": item.username, "time": item.time, "likeState": likeState, "likeNumber":likeCount}
        console.log("article: " + JSON.stringify(articleItem));
        articleList.push(articleItem);
    }
    res.locals.article = articleList;
    res.render("commentArticle");
});

router.get("/login", async function (req, res) {
    res.render("login");
});


router.get("/register", async function (req, res) {
    res.render("register");
});

router.get("/testUsername", async function (req, res) {
    const testUsername = req.query.username;
    console.log("testusername: " + testUsername);
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
        console.log("password not fit")
        const toastMessage = "Inconsistent password input!";
        res.locals.toastMessage = toastMessage;
        res.render("register");
    }
    else if (userData !== undefined) {
        console.log("has same username");
        const toastMessage = "Already has the username, please try another!";
        res.locals.toastMessage = toastMessage;
        res.render("register");
    }
    else {
        const salt = generateSalt();
        const hashedPassword = hashPassword(password, salt);
        const user = {
            "avatar": avatar,
            "username": username,
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
        console.log("user name is: " + user.username);
        const user_id = await userDao.getUserIdByUserName(user.username);
        console.log("user id is: " + JSON.stringify(user_id[0].id));
        addNewFolder(JSON.stringify(user_id[0].id));
        const toastMessage = "You have successfully registered";
        res.locals.toastMessage = toastMessage;
        res.render("login");
    }
});



router.get("/userHomePage", async function (req, res) {
    // Get user articles by username from cookies
    const cookies = req.cookies;
    const username = cookies.username;
    res.locals.articles = await userDao.getAriticlesByUser(username);

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
            const beFollowedId = item.content;
            const beFollowedUsername = await userDao.getUserByUserId(beFollowedId);
            const sender = item.sender;
            // Pass author's avatar
            const sender_id = await userDao.getUserIdByUserName(sender);
            const sender_avatar = await userDao.getAvatarByUserId(sender_id.id);
            const avatar = sender_avatar[0].avatar;

            const title = "Newly followed"
            const content = sender + " followed " + beFollowedUsername;
            const notification = { "title": title, "content": content, "author": sender, "avatar": avatar, "time": time };
            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;


    res.render("userpage");
});

router.post("/deleteArticle", async function (req, res) {

    let articleID = JSON.stringify(req.body.delete);
    articleID = articleID.slice(1, -1);
    res.locals.articleID = articleID;
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
    console.log("Edit Article: " + JSON.stringify(article));

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
        res.render("newArticle");
    });
});


router.post("/submitChange", async function (req, res) {
    let title = req.body.title;
    if (title == "") {
        title = "default title";
    }

    const id = req.body.id;
    await userDao.updateArticletitle(title, id);
    let content = req.body.content;
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

    if (cookie.username != undefined) {

        // Keep login
        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar
    }

    res.locals.articlesArray = articleDataArray;
    res.render("home");
});

router.get("/homeSortByUsername", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articleDataArray = await userDao.retrieveArticleData();
    articleDataArray.sort(sortMethod.compareByAuthor);

    if (cookie.username != undefined) {

        // Keep login
        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;
    }

    res.locals.articlesArray = articleDataArray;

    res.render("home");
});

router.get("/homeSortByDate", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articleDataArray = await userDao.retrieveArticleData();
    articleDataArray.sort(sortMethod.compareByDate);

    if (cookie.username != undefined) {

        // Keep login
        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;

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
    res.locals.articles = articles;

    // Get user avatar by username from cookies
    const userData = await userDao.getUser(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    res.render("userpage");
});

router.get("/sortByDate", async function (req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const articles = await userDao.getAriticlesByUser(username);
    articles.sort(sortMethod.compareByDate);
    res.locals.articles = articles;

    // Get user avatar by username from cookies
    const userData = await userDao.getUser(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    res.render("userpage");
});

router.get("/resetSort", async function (req, res) {
    res.redirect("/userHomePage");
});

// Sorting ends ------------------------------


router.post("/userHomePage", async function (req, res) {
    const username = req.body.username;
    const inputPassword = req.body.password;

    const hasUsername = await userDao.getUser(username);
    if (hasUsername == undefined) {
        const toastMessage = "Has no such user or enter the wrong username!";
        res.locals.toastMessage = toastMessage;
        res.render("login");
    }
    else {
        const saltObjectData = await userDao.getSalt(username);
        const salt = saltObjectData.salt;

        const rightHashedPasswordData = await userDao.getPassword(username);
        const rightHashedPassword = rightHashedPasswordData.password;

        console.log("rightHashedPassword: " + rightHashedPassword);
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
                console.log("receive article");
                res.locals.articles = await userDao.getAriticlesByUser(username);
                res.locals.username = username;
            }

            // Back to home page After login
            res.redirect("/");
        }
        else {
            const toastMessage = "Wrong Password!";
            res.locals.toastMessage = toastMessage;
            res.render("login");
        }
    }
});

router.get("/setting", async function (req, res) {
    res.render("setting");
});



router.get("/logout", async function (req, res) {
    Object.keys(req.cookies).forEach(cookieName => {
        res.clearCookie(cookieName);
    });
    const toastMessage = "Successfully logged out!";
    res.locals.toastMessage = toastMessage;
    res.render("login");
});

router.post("/changeUsername", async function (req, res) {
    const newUsername = req.body.username;

    const cookies = req.cookies;
    const oldUsername = cookies.username;

    const userData = await userDao.hasSameUsername(newUsername);

    if (userData === undefined) {
        await userDao.changeUsername(oldUsername, newUsername);
        console.log("change username suc");

        res.cookie("username", newUsername);
        console.log("change cookie's username suc");

        const toastMessage = "Successfully change the username!";
        res.locals.toastMessage = toastMessage;
        res.render("setting");
    }
    else {
        const toastMessage = "The username already exists!";
        res.locals.toastMessage = toastMessage;
        res.render("setting");
    }
});


router.post("/changeAvatar", async function (req, res) {
    const newAvatar = req.body.avatar;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeAvatar(username, newAvatar);
    // console.log("change ava suc");

    const toastMessage = "Successfully change the Avatar!";
    console.log(toastMessage);
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});

router.post("/changeLastName", async function (req, res) {
    const newLastName = req.body.lastName;
    console.log("get new last name: " + newLastName);

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeLastName(username, newLastName);

    const toastMessage = "Successfully change the Last Name!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});

router.post("/changeFirstName", async function (req, res) {
    const newFirstName = req.body.firstName;
    console.log("get new first name: " + newFirstName);

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeFirstName(username, newFirstName);

    const toastMessage = "Successfully change the First Name!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});

router.post("/changeBirth", async function (req, res) {
    const newBirth = req.body.birth;
    console.log("get new birth: " + newBirth);

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeBirth(username, newBirth);
    const toastMessage = "Successfully change the Date of Birth!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
})


router.post("/changeBirth", async function (req, res) {
    const newBirth = req.body.birth;

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeBirth(username, newBirth);
    console.log("change birth suc");

    const toastMessage = "Successfully change the Birth Day";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});


router.post("/changeDescription", async function (req, res) {
    const newDescription = req.body.description;
    console.log("get new description: " + newDescription);

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeDescription(username, newDescription);
    console.log("change description suc");

    const toastMessage = "Successfully change the Description";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
})


router.post("/delete", async function (req, res) {
    const cookies = req.cookies;
    console.log("cookies: " + JSON.stringify(cookies));
    console.log("username:" + cookies.username);
    const username = cookies.username;

    res.clearCookie("authToken");
    res.clearCookie("username");
    await userDao.deleteTheUser(username);

    const toastMessage = "Successfully deleted account!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
})



router.get("/article", async function (req, res) {
    // Get user avatar by username from cookies
    const cookies = req.cookies;
    const username = cookies.username;
    const userData = await userDao.getUserByUsername(username);
    console.log("userData: " + JSON.stringify(userData));

    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;
    // -----------------------------

    const articleId = req.query.id;
    console.log("id:" + articleId);

    const articleData = await articleDao.getArticleById(articleId);
    res.locals.articleData = articleData;

    const header = articleData.header;
    const author = (await userDao.getAuthor(articleData.user_id)).username;
    const time = articleData.time;
    const content = articleData.content;
    res.locals.header = header;
    res.locals.author = author;
    res.locals.time = time;
    res.locals.content = content;
    res.locals.articleId = articleId

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
            console.log("item: " + JSON.stringify(item));
            const comment = { "comment_id": item.id, "sender": item.username, "recipient": author, "content": item.content, "time": item.time, "nextLevelComment": [] }
            firstLevelCommentData.push(comment);
        }
        else {
            const comment = { "comment_id": item.id, "parent_id": parentId, "sender": item.username, "recipient": null, "content": item.content, "time": item.time, "nextLevelComment": [] }
            s_t_o_ChildrenCommentData.push(comment);
        }
    }
    console.log("firstLevelComment: " + JSON.stringify(firstLevelCommentData));
    console.log("all children comment: " + JSON.stringify(s_t_o_ChildrenCommentData));

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
                t_o_ChildrenCommentData.push(child);
            }
        }
    }

    console.log("second: " + JSON.stringify(secondLevelCommentData));

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
                o_ChildrenCommentData.push(child);
            }
        }
    }

    for (let i = 0; i < thirdLevelCommentData.length; i++) {
        const thirdComment = thirdLevelCommentData[i];
        const thirdCommentId = thirdComment.comment_id;
        const otherCommentData = await commentDao.getAllOtherCommentByCommentId(thirdCommentId);

        console.log("other Comment data: " + JSON.stringify(otherCommentData));
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
            const beFollowedId = item.content;
            const beFollowedUsername = await userDao.getUserByUserId(beFollowedId);
            const sender = item.sender;
            // Pass author's avatar
            const sender_id = await userDao.getUserIdByUserName(sender);
            const sender_avatar = await userDao.getAvatarByUserId(sender_id.id);
            const avatar = sender_avatar[0].avatar;

            const title = "Newly followed"
            const content = sender + " followed " + beFollowedUsername;
            const notification = { "title": title, "content": content, "author": sender, "avatar": avatar, "time": time };
            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    res.locals.firstLevelCommentData = firstLevelCommentData;
    res.render("testArticle");
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
    console.log("succeccfully add comment");
});

router.get("/article/deleComment", async function (req, res) {
    const deleCommentId = req.query.deleCommentId;
    await commentDao.deleCommentByCommentId(deleCommentId);
    res.json();
})

router.get("/goNo", async function (req, res) {

    const cookies = req.cookies;
    const username = cookies.username;

    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;

    // Get user avatar by username from cookies
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

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
            const beFollowedId = item.content;
            const beFollowedUsername = await userDao.getUserByUserId(beFollowedId);
            const sender = item.sender;
            // Pass author's avatar
            const sender_id = await userDao.getUserIdByUserName(sender);
            const sender_avatar = await userDao.getAvatarByUserId(sender_id.id);
            const avatar = sender_avatar[0].avatar;

            const title = "Newly followed"
            const content = sender + " followed " + beFollowedUsername;
            const notification = { "title": title, "content": content, "author": sender, "avatar": avatar, "time": time };
            NotificationList.push(notification);
        }
    }
    for (let i = 0; i < notReadList.length; i++)
    {
        const item = notReadList[i];
        const notificationId = item.id;
        await notificationDao.changeNotificationReadStateById(notificationId);
    }
    res.locals.notificationNum = notificationNum;
    // console.log("NotificationList--" + JSON.stringify(NotificationList));
    res.locals.notification = NotificationList;

    res.render("notification");
})

router.get("/addLike", async function(req, res){
    const articleId = req.query.articleId;

    const cookies = req.cookies;
    const username = cookies.username;

    const userData = await userDao.getUserByUsername(username);
    const userId = userData.id;

    await likeDao.addLike(userId, articleId);

    res.json("add like");
})

router.get("/cancelLike", async function(req, res){
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
    console.log("Folder name is: " + folderName);
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
            console.log("Create folder successful");
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
    console.log("author passed: " + JSON.stringify(authors));
    res.locals.authors = authors;
    const subscribers = await userDao.getSubscribersByUserName(username);
    console.log("subscriber passed: " + JSON.stringify(subscribers));
    res.locals.subscribers = subscribers;
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
    console.log("user name is: " + username + "author is " + author_name);
    console.log("result is: " + result);
    if (username !== author_name) {
        res.locals.NotSameUser = 1;
    }
    if (result == 1) {
        res.locals.subscribe = result;
    }
    res.render("profile");
})

router.get("/subscription/subscriber", async function (req, res) {
    const subscriber_name = req.query.name;
    // get subscriber username
    res.locals.subscriber = subscriber_name;

    // get subscriber profile by subscriber name
    let profile = await userDao.getProfileByName(subscriber_name);

    profile = (JSON.stringify(profile[0].profile))
    profile = profile.slice(1, -1);
    res.locals.profile = profile;

    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;

    // do a check to check whether user are still following author
    const result = await userDao.checkSubscription(subscriber_name, username);
    console.log("user name is: " + username + "subscriber is " + subscriber_name);
    console.log("result is: " + result);
    if (username !== subscriber_name) {
        res.locals.NotSameUser = 1;
    }
    if (result == 1) {
        res.locals.subscribe = result;
    }

    res.render("profile");
})

router.get("/subscription/subsribe", async function (req, res) {
    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;

    if (req.query.author) {
        const author = req.query.author;
        const subscriber = username;

        // add to subscribe table
        const testResult = await userDao.createNewSubscribe(subscriber, author);
        const subscribe_id = JSON.stringify(testResult.lastID);
    }
    const author_name = req.query.author;
    // get author username
    res.locals.author = author_name;

    // get author profile by author name
    let profile = await userDao.getProfileByName(author_name);
    profile = (JSON.stringify(profile[0].profile))
    profile = profile.slice(1, -1);
    res.locals.profile = profile;

    // do a check to check whether user are still following author
    const result = await userDao.checkSubscription(username, author_name);

    if (username !== author_name) {
        res.locals.NotSameUser = 1;
    }
    if (result == 1) {
        res.locals.subscribe = result;
    }
    res.render("profile");

})

router.get("/subscription/unsubsribe", async function (req, res) {
    // Get user name from cookies
    const cookie = req.cookies;
    const username = cookie.username;
    // If you are subscriber
    if (req.query.author) {
        const author = req.query.author;
        const subscriber = username;

        // delete subscribe table
        const testResult = await userDao.deleteSubscribe(subscriber, author);
        const subscribe_id = JSON.stringify(testResult.lastID);
        const author_name = req.query.author;
        // set subscriber username
        res.locals.author = author_name;

        // set author profile by author_name
        let profile = await userDao.getProfileByName(author_name);

        profile = (JSON.stringify(profile[0].profile))
        profile = profile.slice(1, -1);
        res.locals.profile = profile;


        // do a check to check whether subscriber is still following author
        const result = await userDao.checkSubscription(username, author_name);

        if (username !== author_name) {
            res.locals.NotSameUser = 1;
        }
        if (result == 1) {
            res.locals.subscribe = result;
        }
        res.render("profile");
    }// If you are author
    else {
        const author = username;
        const subscriber = req.query.subscriber;
        console.log("author is " + author + " subscriber is " + subscriber);
        // delete subscribe table
        const testResult = await userDao.deleteSubscribe(subscriber, author);
        console.log("test result: " + JSON.stringify(testResult));
        const subscribe_id = JSON.stringify(testResult.lastID);
        const subscriber_name = req.query.subscriber;
        // set subscriber username
        res.locals.subscriber = subscriber;

        // set author profile by author_name
        let profile = await userDao.getProfileByName(subscriber);

        profile = (JSON.stringify(profile[0].profile))
        profile = profile.slice(1, -1);
        res.locals.profile = profile;


        // do a check to check whether subscriber is still following author
        const result = await userDao.checkSubscription(subscriber, username);

        if (username !== subscriber) {
            res.locals.NotSameUser = 1;
        }
        if (result == 1) {
            res.locals.subscribe = result;
        }
        res.render("profile");
    }
})

module.exports = router;