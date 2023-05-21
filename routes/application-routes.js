const express = require("express");
const router = express.Router();

//const testDao = require("../modules/test-dao.js");
const userDao = require("../modules/user-dao.js")


router.get("/", async function (req, res) {

    res.locals.title = "Purple";
    const articleDataArray = await userDao.retrieveArticleData();
    // console.log(JSON.stringify(articleData));
    res.locals.Array = articleDataArray;

    res.render("home");
});

router.get("/article", async function (req, res) {
    console.log("received!");
})

router.get("/login", async function (req, res) {
    res.render("login");
});

router.get("/register", async function (req, res) {
    res.render("register");
});

router.post("/login", async function (req, res) {
    const toastMessage = "You have successfully signed in!"
    res.locals.toastMessage = toastMessage;
    res.render("login");
});

router.post("/userHomePage", async function (req, res) {
    res.render("userpage");
});

router.get("/setting", async function (req, res) {
    res.render("setting");
});


module.exports = router;