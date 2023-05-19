const express = require("express");
const router = express.Router();

const testDao = require("../modules/test-dao.js");

router.get("/", async function(req, res) {

    res.locals.title = "My route title!";
    res.locals.allTestData = await testDao.retrieveAllTestData();

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


module.exports = router;