/**
 * Main application file.
 * 
 * NOTE: This file contains many required packages, but not all of them - you may need to add more!
 */

// Setup Express
const express = require("express");
const app = express();
const path = require("path");
const port = 3000;
const jimp = require("jimp");
const userDao = require("./modules/user-dao.js");

// Setup Handlebars
const handlebars = require("express-handlebars");
app.engine("handlebars", handlebars({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set("view engine", "handlebars");

// Setup fs
const fs = require("fs");

// Setup multer (files will temporarily be saved in the "temp" folder).
const multer = require("multer");
const upload = multer({
    dest: path.join(__dirname, "temp")
});

// Setup body-parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Setup cookie-parser
const cookieParser = require("cookie-parser");
const { log } = require("console");
app.use(cookieParser());

// Make the "public" folder available statically
app.use(express.static(path.join(__dirname, "public")));

// Use the toaster middleware
app.use(require("./middleware/toaster-middleware.js"));

// Setup routes
app.use(require("./routes/application-routes.js"));

// When we POST to /uploadImage, use Multer to process the "imageFile" upload.
// Then, move the uploaded image to /public/uploadedFiles/NAME, where NAME is the
// file's original name.
// Finally, send the image and caption to the uploadDetails view for rendering.
app.post("/uploadImage", upload.single("imageFile"), async function (req, res) {

    const fileInfo = req.file;
    const user_id = req.body.user_id;
    console.log("user_id is: " + user_id);
    // Move the file somewhere more sensible
    const oldFileName = fileInfo.path;
    const newFileName = `./public/uploadedFiles/${user_id}/${fileInfo.originalname}`;
    console.log("File directory " + newFileName);
    fs.renameSync(oldFileName, newFileName);

    // Resize image
    const image = await jimp.read(newFileName);
    image.resize(500, jimp.AUTO);
    await image.write(`./public/uploadedFiles/${user_id}/${fileInfo.originalname}`);

    // Get some information about the file and send it to the uploadDetails view for rendering.
    res.locals.imageName = (`${fileInfo.originalname}`);
    res.locals.fileName = (`${user_id}/${fileInfo.originalname}`);
    res.render("editArticle");

});

// app.get("/uploadImage", function (req, res) {
//     res.redirect("./editArticle");
// })


// Start the server running.
app.listen(port, function () {
    console.log(`App listening on port ${port}!`);
});
