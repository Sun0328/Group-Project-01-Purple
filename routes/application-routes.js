const express = require("express");
const router = express.Router();

//add to use salt
const crypto = require('crypto');

//const testDao = require("../modules/test-dao.js");
const userDao = require("../modules/user-dao.js");
const articleDao = require("../modules/article-dao.js");
const commentDao = require("../modules/comment-dao.js");
const likeDao = require("../modules/like-dao.js");

router.get("/", async function(req, res) {

    const articleData = await articleDao.getAllArticle();

    for (let i = 0; i < articleData.length; i++)
    {
        const articleItem = articleData[i];
        console.log("item:"+ articleItem);
        const articleID = articleItem.id;
        console.log("article id: " + articleID);
        const likeCount = await likeDao.getLikeNumberByArticleId(articleID);
        const key = "likeNumber";
        articleData[i][key] = likeCount;
    }

    res.locals.article = articleData;
    console.log(articleData);
    
    const cookies = req.cookies;
    console.log("cookies: " + JSON.stringify(cookies));

    if (Object.keys(cookies).length > 0)
    {
        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;
    }
  
    res.locals.title = "Purple";
    const articleDataArray = await userDao.retrieveArticleData();
    // console.log(JSON.stringify(articleData));
    res.locals.Array = articleDataArray;
    res.render("home");
});

router.get("/login", async function (req, res) {
    res.render("login");
});


router.get("/register", async function(req, res) {
    res.render("register");
});

router.get("/testUsername", async function(req, res){
    const testUsername = req.query.username;
    console.log("testusername: " + testUsername);
    const userData = await userDao.hasSameUsername(testUsername);
    if(userData === undefined)
    {
        const message = "unique"
        res.json(message);
    }
    else
    {
        const message = "same"
        res.json(message);
    }
})

router.post("/signupMessage", async function(req, res) {
    const avatar = req.body.avatar;
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const lastName = req.body.lastName;
    const firstName = req.body.firstName;
    const birth = req.body.birth;
    const description = req.body.description;

    const [year, month, day]= birth.split('-');
    const yearNumber = parseInt(year, 10);
    const monthNumber = parseInt(month, 10);
    const dayNumber = parseInt(day, 10);

    console.log("username: " + username);
    const userData = await userDao.hasSameUsername(username);
    console.log("search result user data: " + userData);
    console.log("password: " + password);
    console.log("con password: " + confirmPassword);

    if (password != confirmPassword)
    {
        console.log("password not fit")
        const toastMessage = "Inconsistent password input";
        res.locals.toastMessage = toastMessage;
        res.render("signup");
    }
    else if (userData !== undefined)
    {
        console.log("has same username");
        const toastMessage = "Already has the username, please try another!";
        res.locals.toastMessage = toastMessage;
        res.render("signup");
    }
    else
    {
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
            "description": description};
        userDao.createNewUser(user);
    
        const toastMessage = "You have successfully registered";
        res.locals.toastMessage = toastMessage;
        res.render("login");
    }
});

router.get("/userHomePage", async function(req, res){
    res.render("userpage");
});

router.post("/userHomePage", async function(req, res) {
    const username = req.body.username;
    const inputPassword = req.body.password;
    
    const hasUsername = await userDao.getUser(username);
    if (hasUsername == undefined)
    {
        const toastMessage = "Has no such user or enter the wrong username!";
        res.locals.toastMessage = toastMessage;
        res.render("login");
    }
    else
    {
        const saltObjectData = await userDao.getSalt(username);
        const salt = saltObjectData.salt;
        console.log("salt: " + salt);

        const rightHashedPasswordData = await userDao.getPassword(username);
        const rightHashedPassword = rightHashedPasswordData.password;
        console.log("rightHashedPassword: " + rightHashedPassword );

        const hashedInputPassword = hashPassword(inputPassword, salt);
        if (hashedInputPassword == rightHashedPassword)
        {
            const cookieName = "authToken";
            const cookieValue = hashedInputPassword;
            res.cookie(cookieName, cookieValue);
            res.cookie("username",username);

            const toastMessage = "Welcome, " + `${username}` + "!";
            res.locals.toastMessage = toastMessage;
            res.render("userpage");
        }
        else
        {
            const toastMessage = "Wrong Password!";
            res.locals.toastMessage = toastMessage;
            res.render("login");
        }
    }
});

router.get("/setting", async function(req, res) {
    res.render("setting");
});

router.get("/logout", async function(req, res){
    Object.keys(req.cookies).forEach(cookieName => {
        res.clearCookie(cookieName);
      });
    const toastMessage = "Successfully logged out!";
    res.locals.toastMessage = toastMessage;
    res.render("login");
});

router.post("/changeUsername", async function(req, res){
    const newUsername = req.body.username;
    
    const cookies = req.cookies;
    const oldUsername = cookies.username;

    const userData = await userDao.hasSameUsername(newUsername);

    if (userData === undefined)
    {
        await userDao.changeUsername(oldUsername,newUsername);
        console.log("change username suc");
    
        res.cookie("username",newUsername);
        console.log("change cookie's username suc");
    
        const toastMessage = "Successfully change the username!";
        res.locals.toastMessage = toastMessage;
        res.render("setting");
    }
    else
    {
        const toastMessage = "The username already exists!";
        res.locals.toastMessage = toastMessage;
        res.render("setting");
    }
});


router.post("/changeAvatar", async function(req, res){
    const newAvatar = req.body.avatar;
    
    const cookies = req.cookies;
    const username = cookies.username;
    
    await userDao.changeAvatar(username,newAvatar);
    console.log("change ava suc");

    const toastMessage = "Successfully change the Avatar!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});

router.post("/changeLastName", async function(req, res){
    const newLastName = req.body.lastName;
    console.log("get new last name: " + newLastName);
    
    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeLastName(username,newLastName);
    
    const toastMessage = "Successfully change the Last Name!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});

router.post("/changeFirstName", async function(req, res){
    const newFirstName = req.body.firstName;
    console.log("get new first name: " + newFirstName);
    
    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeFirstName(username,newFirstName);

    const toastMessage = "Successfully change the First Name!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});

router.post("/changeBirth", async function(req, res){
    const newBirth = req.body.birth;
    console.log("get new birth: " + newBirth);

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeBirth(username,newBirth);
    const toastMessage = "Successfully change the Date of Birth!";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
})


router.post("/changeBirth", async function(req, res){
    const newBirth= req.body.birth;
    
    const cookies = req.cookies;
    const username = cookies.username;
    
    await userDao.changeBirth(username,newBirth);
    console.log("change birth suc");

    const toastMessage = "Successfully change the Birth Day";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
});


router.post("/changeDescription", async function(req, res){
    const newDescription = req.body.description;
    console.log("get new description: " + newDescription);

    const cookies = req.cookies;
    const username = cookies.username;

    await userDao.changeDescription(username,newDescription);
    console.log("change description suc");

    const toastMessage = "Successfully change the Description";
    res.locals.toastMessage = toastMessage;
    res.render("setting");
})

router.post("/delete", async function(req, res){
    const cookies = req.cookies;
    console.log("cookies: " + JSON.stringify(cookies));
    console.log("username:" + cookies.username);
    const username = cookies.username;

    res.clearCookie("authToken");
    res.clearCookie("username");
    await userDao.deleteTheUser(username);

    const toastMessage = "Successfully deleted account!";
    res.locals.toastMessage = toastMessage;
    res.render("home");
})

router.get("/article", async function(req, res){
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
    
    const commentData = await commentDao.getCommentByArticleId(articleData.id);
    res.locals.commentData = commentData;

    res.render("article");
});

router.get("/article/comment", async function(req, res){
    const commentContent = req.query.commentContent;
    const articleId = req.query.articleId;

    const cookies = req.cookies;
    const sender = cookies.username;
    const recipient = null;
    
    const userData = await userDao.getUserByUsername(sender);
    const senderId = userData.id;

    const commentId = await commentDao.addCommentIntoCommentTable(senderId, recipient, commentContent, articleId);
    const commentData = await commentDao.getCommentByCommentId(commentId);

    res.json(commentData);
    console.log("succeccfully add comment");
})


const generateSalt = function() {
    const salt = crypto.randomBytes(16);
    return salt.toString('hex');
  };
  
const hashPassword = function(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  };

module.exports = router;