const express = require("express");
const router = express.Router();
// Setup fs
const fs = require("fs");
//add to use salt
const crypto = require('crypto');

//const testDao = require("../modules/test-dao.js");
const userDao = require("../modules/user-dao.js");

//sort array function
const sortMethod = require("../modules/sort.js");


router.get("/", async function (req, res) {

    res.locals.title = "Purple";
    const articleDataArray = await userDao.retrieveArticleData();
    // console.log(JSON.stringify(articleDataArray));
    res.locals.articlesArray = articleDataArray;

    const cookies = req.cookies;
    console.log("cookies: " + JSON.stringify(cookies));

    if (Object.keys(cookies).length > 0) {
        const hasLogin = "has login";
        res.locals.hasLogin = hasLogin;

        // Get user avatar by username from cookies
        const username = cookies.username;
        const userData = await userDao.getUser(username);
        const user_avatar = userData.avatar;
        res.locals.avatar = user_avatar;
    }

    res.render("home");
});

router.get("/article", async function (req, res) {
    console.log("received!");
});

router.get("/login", async function (req, res) {
    res.render("login");
});


router.get("/register", async function (req, res) {
    res.render("register");
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
        console.log("user name is: "+user.username);
        const user_id = await userDao.getUserIdByUserName(user.username);
        console.log("user id is: "+JSON.stringify(user_id[0].id));
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
    getFileNames(folderPath,function(files){
        res.locals.files = files;
    res.render("editArticle");
    });
});

router.post("/newArticle", async function(req, res) {
    const cookie = req.cookies;
    const username = cookie.username;
    const userID = await userDao.getUserIdByUserName(username);
    let articleID = await userDao.createNewArticle(userID);
    res.locals.articleID = JSON.stringify(articleID.lastID);
    let article = await userDao.getArticleById(JSON.stringify(articleID.lastID));
    article = article[0];
    res.locals.article = article;
    console.log("New Article: " + JSON.stringify(article));

    const folderPath = `./public/uploadedFiles/${article.user_id}`;
    getFileNames(folderPath,function(files){
        res.locals.files = files;
        res.render("newArticle");
    });
    
});


router.post("/submitChange", async function(req, res) {
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
    if (image){
        await userDao.updateArticleImage(image, id);
    }
    await userDao.updateArticlecontent(content, id);

    res.redirect("/userHomePage");
});

// Sort functions for home page ---------

router.post("/homeSortByTitle", async function (req, res) {
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

router.post("/homeSortByUsername", async function (req, res) {
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

router.post("/homeSortByDate", async function (req, res) {
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

router.post("/homeResetSort", async function (req, res) {
    res.redirect("/");
});

// Sort functions for user page -----------

router.post("/sortByTitle", async function (req, res) {
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

router.post("/sortByDate", async function (req, res) {
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

router.post("/resetSort", async function (req, res) {
    res.redirect("/userHomePage");
});

// Sorting ends

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
    console.log("change ava suc");

    const toastMessage = "Successfully change the Avatar!";
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
    res.render("home");

})

const generateSalt = function () {
    const salt = crypto.randomBytes(16);
    return salt.toString('hex');
};

const hashPassword = function (password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

function addNewFolder(user_id){
    const folderName = `./public/uploadedFiles/${user_id}`;
    console.log("Folder name is: "+folderName);
    try {
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
        console.log("Create folder successful");
    }
    } catch (err) {
    console.error(err);
    }
}

function getFileNames(folderPath, callback){
    fs.readdir(folderPath, (err, files) =>{
    if (err){
        console.error(err);
        return;
    }
    callback(files);
})
}


module.exports = router;