const express = require("express");
const router = express.Router();

//const testDao = require("../modules/test-dao.js");
const userDao = require("../modules/user-dao.js")


router.get("/", async function(req, res) {

    res.locals.title = "My route title!";
    const allStuff = ["Fiona", "Annie", "Jennie", "Shiyan"];
    res.locals.allTestData = allStuff;
    res.render("home");
});

router.get("/login", async function(req, res) {
    res.render("login");
});

router.get("/signup", async function(req, res) {
    res.render("signup");
});

router.post("/login", async function(req, res) {
    const toastMessage = "You have successfully signed in!"
    res.locals.toastMessage = toastMessage;
    res.render("login");
});

router.post("/userHomePage", async function(req, res) {
    if (req.body.delete){
        console.log("receive delete query");
    }else{
        const username = req.body.username;
        res.locals.articles = await userDao.getAriticlesByUser(username);
        res.locals.username = username;
    }
    res.render("userpage");
});
  
router.post("/deleteArticle", async function(req, res) {
    let articleID = JSON.stringify(req.body.delete);
    articleID = articleID.slice(1, -1);
    res.locals.articleID = articleID;
    await userDao.deleteArticleById(articleID);
    res.render("deleteArticle");
});

router.get("/setting", async function(req, res) {
    res.render("setting");
});

function compareByHeader( a, b ) {
    if ( a.header < b.header ){
      return -1;
    }
    if ( a.header > b.header ){
      return 1;
    }
    return 0;
}

function compareByAuthor( a, b ) {
    if ( a.username < b.username ){
      return -1;
    }
    if ( a.username > b.username ){
      return 1;
    }
    return 0;
}


function compareByDate( a, b ) {
    if ( a.date < b.date ){
      return -1;
    }
    if ( a.date > b.date ){
      return 1;
    }
    return 0;
}

module.exports = router;