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
    console.log(JSON.stringify(articleDataArray));
    res.locals.articlesArray = articleDataArray;

    const cookies = req.cookies;


    if (Object.keys(cookies).length > 0) {
        const username = cookies.username;
        const userData = await userDao.getUserByUsername(username);
        const userId = userData.id;
        res.locals.userId = userId;

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

        // console.log("cookies: " + JSON.stringify(cookies));

        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies
        console.log("userData: " + JSON.stringify(userData));

        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;


        // For notification
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

                const senderData = await userDao.getUserByUsername(sender);

                // Pass author's avatar
                //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
                const sender_id = senderData.id;
                const avatar = senderData.avatar;
                const articleData = await articleDao.getArticleById(commentData.article_id);
                const articleHeader = articleData.header;
                const title = sender + " send a comment on Article: " + articleHeader;
                const time = commentData.time;
                const notification = {"id":item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type":type, "typeId": commentId};
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
                const notification = {"id":item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type":type,"typeId": articleId};
                NotificationList.push(notification);
            }
            else if (type == "subscribe") {
                console.log("item: " + JSON.stringify(item));
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
                const notification = {"id":item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type":type,"typeId": subscribeId};

                NotificationList.push(notification);
            }
        }
        console.log("NotificationList: " + JSON.stringify(NotificationList));
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
    res.locals.articles = await userDao.getAriticlesByUser(username);

    // Get user avatar by username from cookies
    const userData = await userDao.getUser(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

    // For notification
    const userId = userData.id;

    const allNotificationData = await notificationDao.getNotificationByUserId(userId);
    let notReadList = [];
    for (let i = 0; i < allNotificationData.length; i++) 
    {
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
            const notification = {"id":item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type":type, "typeId": commentId};
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
            const notification = {"id":item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type":type,"typeId": articleId};
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            console.log("item: " + JSON.stringify(item));
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
            const notification = {"id":item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type":type,"typeId": subscribeId};

            NotificationList.push(notification);
        }
    }
    console.log("NotificationList: " + JSON.stringify(NotificationList));
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;
    res.render("userpage");
});

router.post("/deleteArticle", async function (req, res) {

    let articleID = req.body.delete;
    res.locals.articleID = articleID;

    const type = "article";
    console.log("here0");
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

    const user = await userDao.getUserByUsername(username);
    const user_id = user.id;
    deleteFolder(JSON.stringify(user_id));

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
    console.log("articleData---------" + JSON.stringify(articleData));
    res.locals.articleData = articleData;

    const header = articleData.header;
    const author = (await userDao.getAuthor(articleData.user_id)).username;
    const time = articleData.time;
    const content = articleData.content;
    const img = articleData.image;
    res.locals.header = header;
    res.locals.author = author;
    res.locals.time = time;
    res.locals.content = content;
    res.locals.articleId = articleId;
    res.locals.image = img;

    const allCommentData = await commentDao.getCommentByArticleId(articleId);
    
    let firstLevelCommentData = [];
    let s_t_o_ChildrenCommentData = [];
    let t_o_ChildrenCommentData = [];
    let o_ChildrenCommentData = [];

    let secondLevelCommentData = [];
    let thirdLevelCommentData = [];
    let otherLevelCommentData = [];
    
    for (let i = 0; i < allCommentData.length; i++)
    {
        const item = allCommentData[i];
        const parentId = item.parent_id;
        if (parentId === null)
        {
            console.log("item: " + JSON.stringify(item));
            const comment = {"comment_id":item.id,"sender":item.username,"recipient":author, "content":item.content, "time":item.time, "nextLevelComment": []}
            firstLevelCommentData.push(comment);
        }
        else
        {
            const comment = {"comment_id":item.id, "parent_id":parentId, "sender":item.username,"recipient":null, "content":item.content, "time":item.time, "nextLevelComment": []}
            s_t_o_ChildrenCommentData.push(comment);
        }
    }
    console.log("firstLevelComment: " + JSON.stringify(firstLevelCommentData));
    console.log("all children comment: " + JSON.stringify(s_t_o_ChildrenCommentData));
    
    for (let i = 0; i < s_t_o_ChildrenCommentData.length; i++)
    {
        const child = s_t_o_ChildrenCommentData[i];
        const parentId = child.parent_id;
        for (let j = 0; j < firstLevelCommentData.length; j++)
        {
            const parent = firstLevelCommentData[j];
            const id = parent.comment_id;
            if (parentId === id)
            {
                child.recipient = parent.sender;
                parent.nextLevelComment.push(child);
                secondLevelCommentData.push(child);
            }
            else
            {
                if (t_o_ChildrenCommentData.indexOf(child) === -1) 
                {
                    t_o_ChildrenCommentData.push(child);
                }

            }
        }
    }
    console.log("-----------------")
    console.log("t_o_ChildrenCommentData: " + JSON.stringify(t_o_ChildrenCommentData));
    console.log("second: " + JSON.stringify(secondLevelCommentData));

    for (let i = 0; i < t_o_ChildrenCommentData.length; i++)
    {
        const child = t_o_ChildrenCommentData[i];
        const parentId = child.parent_id;
        for (let j = 0; j < secondLevelCommentData.length; j++)
        {
            const secondLevelComment = secondLevelCommentData[j];
            const id = secondLevelComment.comment_id;
            if (parentId === id)
            {
                child.recipient = secondLevelComment.sender;
                secondLevelComment.nextLevelComment.push(child);
                thirdLevelCommentData.push(child);
            }
            else
            {
                if (o_ChildrenCommentData.indexOf(child) === -1) 
                {
                    o_ChildrenCommentData.push(child);
                }
            }
        }
    }
    console.log("third: " + JSON.stringify(thirdLevelCommentData));
    for (let i = 0; i < thirdLevelCommentData.length; i++)
    {
        const thirdComment = thirdLevelCommentData[i];
        const thirdCommentId = thirdComment.comment_id;
        const otherCommentData = await commentDao.getAllOtherCommentByCommentId(thirdCommentId);

        console.log("other Comment data: " + JSON.stringify(otherCommentData));
        for (let j = 0; j < otherCommentData.length; j++)
        {
            const item = otherCommentData[j];
            if (item.id != thirdCommentId)
            {
                const parentId = item.parent_id;
                const recipient = (await commentDao.getSenderByCommentId(parentId)).username;
                const otherComment = {"comment_id":item.id,"sender":item.username,"recipient":recipient, "content":item.content, "time":item.time, "nextLevelComment": []}
                otherLevelCommentData.push(otherComment);
                thirdComment.nextLevelComment.push(otherComment);
            }
        }
    }

    res.locals.firstLevelCommentData = firstLevelCommentData;
    console.log("----------------------first level comment data------------");
    console.log("firstLevelCommentData: "+ JSON.stringify(firstLevelCommentData));

    // For notification
    const userId = userData.id;

    // For notification
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
            const senderData = await userDao.getUserByUsername(sender);
            // Pass author's avatar
            //const sender_avatar = await userDao.getAvatarByUserId(sender_id);
            const sender_id = senderData.id;
            const avatar = senderData.avatar;
            const articleData = await articleDao.getArticleById(commentData.article_id);
            const articleHeader = articleData.header;
            const title = sender + " send a comment on Article: " + articleHeader;
            const time = commentData.time;
            const notification = {"id":item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type":type, "typeId": commentId};
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
            const notification = {"id":item.id, "title": title, "content": content, "author": sender, "avatar": avatar, "time": time, "type":type,"typeId": articleId};
            NotificationList.push(notification);
        }
        else if (type == "subscribe") {
            console.log("item: " + JSON.stringify(item));
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
            const notification = {"id":item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type":type,"typeId": subscribeId};

            NotificationList.push(notification);
        }
    }
    console.log("NotificationList: " + JSON.stringify(NotificationList));
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

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
});

router.get("/goNotificationDetail", async function (req, res) {
    const username = req.query.userId;
    const notificationType = req.query.type;
    const notificationTypeId = req.query.content;
    const notificationId = req.query.notificationId;
    if (notificationType == "comment"){
        const articleData = await commentDao.getArticleByCommentId(notificationTypeId);
        const articleId = articleData.article_id;
        await notificationDao.changeNotificationReadStateById(notificationId);
        res.redirect(`./article?id=${articleId}`);
    }
    else if (notificationType == "article"){
        const articleId = notificationTypeId;
        await notificationDao.changeNotificationReadStateById(notificationId);
        res.redirect(`./article?id=${articleId}`);
    }
    else if (notificationType == "subscribe"){
        const subscribeId = notificationTypeId;
        const subscribeData = await subscribeDao.getSubscribeDataBySubscribeId(subscribeId);
        const FollowerId = subscribeData.subscriber_id;
        const FollowerData= await userDao.getUserByUserID(FollowerId);
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
            console.log("item: " + JSON.stringify(item));
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
            const notification = {"id":item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type":type,"typeId": subscribeId};

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
    const authorData = await userDao.getUserIdByUserName(author_name);
    const profileAvatar = authorData.avatar;
    res.locals.profileAvatar = profileAvatar;
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

    const subscriber_id = await userDao.getUserIdByUserName(subscriber_name);
    const profileAvatar = await userDao.getAvatarByUserId(subscriber_id.id);
    res.locals.profileAvatar = profileAvatar[0].avatar;
    res.locals.articles = await userDao.getAriticlesByUser(subscriber_name);
    const userData = await userDao.getUserByUsername(username);
    const user_avatar = userData.avatar;
    res.locals.avatar = user_avatar;

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
        const subscribe_id = await userDao.getSubscribeId(author, subscriber);
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

        if (username !== subscriber) {
            res.locals.NotSameUser = 1;
        }
        if (result == 1) {
            res.locals.subscribe = result;
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
            console.log("item: " + JSON.stringify(item));
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
            const notification = {"id":item.id, "title": title, "content": content, "author": senderData.username, "avatar": avatar, "time": time, "type":type,"typeId": subscribeId};

            NotificationList.push(notification);
        }
    }
    res.locals.notificationNum = notificationNum;
    res.locals.notification = NotificationList;

    // get user liked article list
    const like_list = await userDao.getLikesByUserId(user_id);

    let article_id_list = [];
    for (let index = 0; index < like_list.length; index++) {

        console.log("likelist : " + JSON.stringify(like_list[index].article_id));
        article_id_list[index] = like_list[index].article_id;
    }

    console.log("article id list : " + article_id_list);
    let articlesArray = await userDao.retrieveArticleDataByIdList(article_id_list);
    for (let i = 0; i < articlesArray.length; i++) {
        const item = articlesArray[i];
        const articleId = like_list[i].article_id;
        const likeArticle = await likeDao.getLikeStateByUserIDandArticleId(user_id.id, articleId);

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

        articlesArray[i][likStateKey] = likeState;
        articlesArray[i][likeNumberKey] = likeCount;
    }

    console.log("articles----" + JSON.stringify(articlesArray));
    res.locals.articles = articlesArray;

    res.render("favorite");
});


function deleteFolder(user_id){
    const path = `./public/uploadedFiles/${user_id}`;
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
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

    const topNumber = 3;

    const subscribeData = await subscribeDao.getSubscribeDataByAuthorId(userId);
    const followerNumber = subscribeData.length;
    res.locals.followerNumber = followerNumber;

    const articleData = await articleDao.getAuthorAllArticle(userId);
    const articleNumber = articleData.length;
    let commentNumber = 0;
    let likeNumber = 0;
    let hasPopularIndexList = [];
    let hasNoPopularIndexList = [];
    for (let i = 0; i < articleNumber; i++)
    {
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
        if ( popularIndex == 0)
        {
            item["hasPopularIndex"] = false;
            hasNoPopularIndexList.push(item);
        }
        else
        {
            item["hasPopularIndex"] = true;
            hasPopularIndexList.push(item);
        }
    }
    res.locals.allCommentNumber = commentNumber;
    res.locals.allLikeNumber = likeNumber;

    if (articleNumber >= 3)
    {
        if (hasPopularIndexList >= 3)
        {
            let mostPopularList = [];
            for (let i = 0; i < hasPopularIndexList.length; i++)
            {
                for (let j = i + 1; j < hasPopularIndexList.length; j++)
                {
                    if (hasPopularIndexList[j].popularIndex > hasPopularIndexList[i].popularIndex)
                    {
                        let temp = hasPopularIndexList[i];
                        hasPopularIndexList[i] = hasPopularIndexList[j];
                        hasPopularIndexList[j] = temp;
                    }
                }
            }
    
            for (let i = 0; i < 3; i++)
            {
                const item = hasPopularIndexList[i];
                mostPopularList.push(item);
            }
            res.locals.mostPopularList = mostPopularList;

            let dailyCommentDataList = [];
            for (let i = 0; i < mostPopularList.length; i++)
            {
                const item = mostPopularList[i];
                const commentId = item.id;
                const dateStr = item.time;
                const dateObj = new Date(dateStr);

                const year = dateObj.getFullYear();
                const month = dateObj.getMonth() + 1;
                const day = dateObj.getDate();

                const time = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
                const dailyComment = {"commentId": commentId, "time": time};
                dailyCommentDataList.push(dailyComment);
            }
            res.locals.dailyCommentDataList = dailyCommentDataList;
        }
        else if (hasPopularIndexList <= 0)
        {
            let noArticleHasPopularIndex= [];
            for (let i = 0; i < 3; i++)
            {
                const item = hasNoPopularIndexList[i];
                noArticleHasPopularIndex.push(item);
            }
            res.locals.noArticleHasPopularIndex = noArticleHasPopularIndex;
        }
        else if (hasPopularIndexList > 0 && hasPopularIndexList < 3)
        {
            let mostPopularList = [];
            let defaultList = [];
            const hasPopularIndexArticleNumber = hasPopularIndexList.length;
            const restSpace = topNumber - hasPopularIndexArticleNumber;
            for (let i = 0; i < hasPopularIndexList.length; i++)
            {
                const hasIndexArticle = hasPopularIndexList[i];
                mostPopularList.push(hasIndexArticle);
            }
            for (let i = 0; i < restSpace; i++)
            {
                const noIndexArticle = hasNoPopularIndexList[i];
                defaultList.push(noIndexArticle);
            }
            res.locals.mostPopularList = mostPopularList;
            res.locals.defaultList = defaultList;

            let dailyCommentDataList = [];
            for (let i = 0; i < mostPopularList.length; i++)
            {
                const item = mostPopularList[i];
                const commentId = item.id;
                const dateStr = item.time;
                const dateObj = new Date(dateStr);

                const year = dateObj.getFullYear();
                const month = dateObj.getMonth() + 1;
                const day = dateObj.getDate();

                const time = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
                const dailyComment = {"commentId": commentId, "time": time};
                dailyCommentDataList.push(dailyComment);
            }
            res.locals.dailyCommentDataList = dailyCommentDataList;
        }
    }
    else if (articleNumber == 0)
    {
        const noArticle= "has no article";
        res.locals.noArticle = noArticle;
    }


    res.render("analytics");
})


module.exports = router;