const express = require("express");
const router = express.Router();

//const testDao = require("../modules/test-dao.js");
const userDao = require("../modules/user-dao.js")


router.get("/", async function(req, res) {
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
    res.render("userpage");
});

router.get("/setting", async function(req, res) {
    res.render("setting");
});


module.exports = router;