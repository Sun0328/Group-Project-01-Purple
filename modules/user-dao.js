const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");



async function hasSameUsername(username){
    const db = await dbPromise;

    const testUsername = username;
    console.log("testUsername: " + testUsername);
    const userData= await db.get(SQL`
        select username from user
        where username = ${testUsername}`);
    console.log("user data: " + userData);
    return userData;
}

async function createNewUser(user){
    const db = await dbPromise;

    const result = await db.run(SQL`
        insert into user (username, password, fname, lname, year, month, day, profile, avatar, salt) 
        values(${user.username}, ${user.hashPassword}, ${user.firstName},
            ${user.lastName}, ${user.year}, ${user.month}, ${user.day},
            ${user.description},${user.avatar}, ${user.salt})`);

    // Get the auto-generated ID value, and assign it back to the user object.
    user.id = result.lastID;
}

async function getAriticlesByUser(username){
    const db = await dbPromise;
    // get user id from user name
    const user = await db.all(SQL`
        select * from user 
            where username = ${username}
    `);
    // get article array from user id
    const articleArray = await db.all(SQL`
        select * from article 
            where user_id = ${user[0].id}
    `);
    // manually assign user name to article array
    articleArray.forEach(element => {
        element.username = username;
    });
    console.log("Article: "+JSON.stringify(articleArray));
    return articleArray;
}

async function deleteArticleById(id) {
    const db = await dbPromise;
    console.log (id);
    await db.run(SQL`
    delete from article
    where id = ${id};`);
}
async function getUser(username){
    const db = await dbPromise;

    const testUsername = username;
    console.log("testUsername in getUser: " + testUsername);
    const userData= await db.get(SQL`
        select * from user
        where username = ${testUsername}`);
    console.log("user data: " + userData);
    return userData;
}

async function getSalt(username){
    const db = await dbPromise;

    const testUsername = username;
    console.log("testUsername in getSalt: " + testUsername);
    const salt= await db.get(SQL`
        select salt from user
        where username = ${testUsername}`);
    return salt;
}

async function getPassword(username){
    const db = await dbPromise;

    const testUsername = username;
    console.log("testUsername in getPassword: " + testUsername);
    const hashedPassword= await db.get(SQL`
        select password from user
        where username = ${testUsername}`);
    console.log("hashed password: " + hashedPassword);
    return hashedPassword;
}

async function deleteTheUser(username){
    const db = await dbPromise;
    
    const testUsername = username;
    await db.run(SQL`
        DELETE FROM user
        WHERE username = ${testUsername}`);
}

async function changeUsername(oldUsername, newUsername){
    const db = await dbPromise;

    const username= oldUsername;
    const nUsername = newUsername;
    await db.run(SQL`UPDATE user
        SET username = ${nUsername} 
        WHERE id = ${user.id}`);
}


async function changeAvatar(nowUsername, newAvatar){
    const db = await dbPromise;

    const username= nowUsername;
    const nAvatar = newAvatar;
    const user = await db.get(SQL`
        select * from user
        where username = ${username}`);
    await db.run(SQL`UPDATE user
        SET avatar = ${nAvatar} 
        WHERE id = ${user.id}`);
}

async function retrieveArticleData() {
    const db = await dbPromise;

    const article = await db.all(SQL`
        select * from article
        `);

    return article;
}

async function changeLastName(nowUsername, newLastName){
    const db = await dbPromise;

    const username= nowUsername;
    const nLastName = newLastName;

    const user = await db.get(SQL`
        select * from user
        where username = ${username}`);


    await db.run(SQL`UPDATE user
        SET lname = ${nLastName} 
        WHERE id = ${user.id}`);
}

async function changeFirstName(nowUsername, newFirstName){
    const db = await dbPromise;

    const username= nowUsername;
    const nFirstName = newFirstName;

    const user = await db.get(SQL`
        select * from user
        where username = ${username}`);

    await db.run(SQL`UPDATE user
        SET fname = ${nFirstName} 
        WHERE id = ${user.id}`);
}

async function changeBirth(nowUsername, newBirth){
    const db = await dbPromise;

    const username= nowUsername;
    const birth = newBirth;
    const [year, month, day]= birth.split('-');
    const nYear = parseInt(year, 10);
    const nMonth = parseInt(month, 10);
    const nDay = parseInt(day, 10);

    const user = await db.get(SQL`
        select * from user
        where username = ${username}`);

    await db.run(SQL`UPDATE user
        SET year = ${nYear},month = ${nMonth},day = ${nDay}
        WHERE id = ${user.id}`);
}

async function changeDescription(nowUsername, newDescription){
    const db = await dbPromise;

    const username= nowUsername;
    const nDescription = newDescription;
    
    const user = await db.get(SQL`
        select * from user
        where username = ${username}`);

    await db.run(SQL`UPDATE user
        SET profile= ${nDescription} 
        WHERE id = ${user.id}`);
}

module.exports = {
    retrieveAllDataInLikes,
    getAriticlesByUser,
    deleteArticleById,
    hasSameUsername,
    createNewUser,
    getUser,
    getSalt,
    getPassword,
    deleteTheUser,
    changeUsername,
    changeAvatar,
    changeLastName,
    changeFirstName,
    changeBirth,
    changeDescription,
    retrieveArticleData

}