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

async function getUserByUsername(username){
    const db = await dbPromise;

    const testUsername = username;
    const userData= await db.get(SQL`
        select * from user
        where username = ${testUsername}`);
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
    // get user avatar from user id
    let userAvatar = await db.all(SQL`
        select avatar from user 
            where username = ${username}
    `);
    console.log("avatar is"+JSON.stringify(userAvatar));
    // manually assign user avatar to article array
    articleArray.forEach(element => {
        element.avatar = userAvatar[0].avatar;
    });
    return articleArray;
}

async function deleteArticleById(id) {
    const db = await dbPromise;
    await db.run(SQL`
    delete from article
    where id = ${id};`);
}
async function getUser(username){
    const db = await dbPromise;

    const testUsername = username;
    const userData= await db.get(SQL`
        select * from user
        where username = ${testUsername}`);

    console.log(JSON.stringify(username));    
    console.log(userData);    
    return userData;
}

async function getAuthor(inputID){
    const db = await dbPromise;

    const authorID = inputID;
    const authorName = await db.get(SQL`
        select username from user
        where id = ${authorID}`);
    return authorName;
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
    console.log("old user name is: "+oldUsername);
    console.log("new user name is: "+newUsername);
    const user = await db.get(SQL`
        select * from user
        where username = ${oldUsername}`);
    console.log("user is: "+user);
    await db.run(SQL`UPDATE user
        SET username = ${newUsername} 
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
    
    //get user id lists
    const userID = await db.all(SQL`
        select user_id from article 
    `);
    console.log("User id list: "+JSON.stringify(userID));
    // get user name from user id
    let username = [];
    const user = await db.all(SQL`
        select * from user
    `);
    let index=0;
    user.forEach(element => {
        userID.forEach(idElement => {
            if (element.id == JSON.stringify(idElement.user_id)){
                username[index] = element.username;
                index += 1;
            }
        });
    });
    console.log("user id: "+JSON.stringify(userID));
    // get user avatar from user id
    let userAvatar = [];
    let index2 = 0;
    user.forEach(element => {
        userID.forEach(idElement => {
            if (element.id == JSON.stringify(idElement.user_id)){
                userAvatar[index2] = element.avatar;
                index2 += 1;
            }
        });
    });
    console.log("list of user avatar: "+ userAvatar);
    // manually assign user name to article array
    
    for (let i = 0; i < username.length; i++) {
        article[i].username = username[i];
    }
    // manually assign user avatar to article array
    for (let i = 0; i < userAvatar.length; i++) {
        article[i].avatar = userAvatar[i];
    }

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

async function getArticleById(id){
    const db = await dbPromise;
    const articleID = id;
    return await db.all(SQL`
        select * from article
        where id = ${articleID}`);
}

async function getAvatarByUserId(id){
    const db = await dbPromise;
    const userId = id;
    return await db.all(SQL`
        select avatar from user
        where id = ${userId}`);
}

async function updateArticletitle(title, id){
    const db = await dbPromise;
    return await db.run(SQL`
    UPDATE article
    SET header = ${title}
    WHERE id = ${id}
    `);
}

async function updateArticlecontent(content, id){
    const db = await dbPromise;
    const articleContent = content;
    return await db.run(SQL`
    UPDATE article
    SET content = ${articleContent}
    WHERE id = ${id}
    `);
}

async function updateArticleImage(image, id){
    const db = await dbPromise;
    const articleImage = image;
    return await db.run(SQL`
    UPDATE article
    SET image = ${articleImage}
    WHERE id = ${id}
    `);
}

async function createNewArticle(userid) {
    const db = await dbPromise;
    console.log("user_id is: "+JSON.stringify (userid.id));
    return await db.run(SQL`
        insert into article (header, content, time, user_id) 
        VALUES("Default header", "Default content", DATETIME('now'), ${JSON.stringify (userid.id)}) RETURNING *;`);
}

async function getUserIdByUserName(username) {
    const db = await dbPromise;
    return await db.get(SQL`
        select id from user
        where username = ${username}`);
    
}
async function getAuthorsByUserName(username) {
    const db = await dbPromise;
    
    //get user id
    const userID = await db.all(SQL`
        select id from user
        where username = ${username}`);
    
    // get author id list
    let author_id = await db.all(SQL`
        select author_id from subscribe
        where subscriber_id = ${userID[0].id}`);
   

    const user = await db.all(SQL`
            select * from user
        `);
    
    let userNameList = [];
    let index = 0;
    user.forEach(element => {
        author_id.forEach(idElement => {
            
            if (JSON.stringify(element.id) == JSON.stringify(idElement.author_id)){
                let variable = JSON.stringify(element.username);
                userNameList[index] = variable.slice(1,-1);
                index += 1;
            }
        });
    });
    // Create Profile list
    let userProfileList = [];
    let index2 = 0;
    user.forEach(element => {
        author_id.forEach(idElement => {
            if (JSON.stringify(element.id) == JSON.stringify(idElement.author_id)){
                let variable = JSON.stringify(element.profile);
                userProfileList[index2] = variable.slice(1,-1);
                index2 += 1;
            }
        });
    });
    // assign properties to author
    let author = []
    for(let i = 0; i<userNameList.length;i++){
        let item = {username:null, profile:null};
        item.username = userNameList[i];
        item.profile = userProfileList[i];
        author.push(item);
    }
    
    return author;
}

async function getSubscribersByUserName(username) {
    const db = await dbPromise;
    //get user id
    const userID = await db.all(SQL`
        select id from user
        where username = ${username}`);
    // get subscriber id list
    let subscriber_id = await db.all(SQL`
        select subscriber_id from subscribe
        where author_id = ${userID[0].id}`);

    const user = await db.all(SQL`
            select * from user
        `);

    let userNameList = [];
    let index = 0;
    user.forEach(element => {
        subscriber_id.forEach(idElement => {
            if (JSON.stringify(element.id) == JSON.stringify(idElement.subscriber_id)){
                let variable = JSON.stringify(element.username);
                userNameList[index] = variable.slice(1,-1);
                index += 1;
            }
        });
    });
    // Create Profile list
    let userProfileList = [];
    let index2 = 0;
    user.forEach(element => {
        subscriber_id.forEach(idElement => {
            if (JSON.stringify(element.id) == JSON.stringify(idElement.subscriber_id)){
                let variable = JSON.stringify(element.profile);
                userProfileList[index2] = variable.slice(1,-1);
                index2 += 1;
            }
        });
    });
    // assign properties to subscriber
    let subscriber = []
    for(let i = 0; i<userNameList.length;i++){
        let item = {username:null, profile:null};
        item.username = userNameList[i];
        item.profile = userProfileList[i];
        subscriber.push(item);
    }

    return subscriber;
}

async function getProfileByName(username){
    const db = await dbPromise;
    return await db.all(SQL`
        select profile from user
        where username = ${username}
        `);
}
async function checkSubscription(subscriber_name, author_name){
    const db = await dbPromise;
    subscriber_id = await getUserIdByUserName(subscriber_name);
    author_id = await getUserIdByUserName(author_name);
    const result = await db.all(SQL`
        SELECT * FROM subscribe WHERE author_id = ${author_id.id} AND subscriber_id = ${subscriber_id.id}
    `);
    if (result.length == 0){
        return 0;
    }else{
        return 1;
    }
}

async function createNewSubscribe(subscriber_name, author_name){
    const db = await dbPromise;
    // check existence
    console.log("inside create new");
    const check = await checkSubscription(subscriber_name, author_name);
    console.log("check: "+check);
    if (check == 0){
        subscriber_id = await getUserIdByUserName(subscriber_name);
        author_id = await getUserIdByUserName(author_name);
        console.log("subscriber_id"+JSON.stringify(subscriber_id));
        console.log("author_id"+JSON.stringify(author_id));
        return await db.run(SQL`
        insert into subscribe (author_id, subscriber_id) 
        VALUES(${author_id.id}, ${subscriber_id.id}) RETURNING *;`);
    }
    
}

async function deleteSubscribe(subscriber_name, author_name){
    const db = await dbPromise;
    // check existence
    console.log("inside delete");
    const check = await checkSubscription(subscriber_name, author_name);
    console.log("check: "+check);
    // if subscribe exist
    if (check == 1){
        subscriber_id = await getUserIdByUserName(subscriber_name);
        author_id = await getUserIdByUserName(author_name);
        console.log("subscriber_id"+JSON.stringify(subscriber_id));
        console.log("author_id"+JSON.stringify(author_id));
        return await db.run(SQL`
        DELETE FROM subscribe
        WHERE subscriber_id = ${subscriber_id.id} AND author_id = ${author_id.id}
        RETURNING *;`);
    }
    
}

module.exports = {
    getAriticlesByUser,
    deleteArticleById,
    hasSameUsername,
    getUserByUsername,
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
    retrieveArticleData,
    getAuthor,
    getArticleById,
    getAvatarByUserId,
    updateArticletitle,
    updateArticlecontent,
    createNewArticle,
    getUserIdByUserName,
    updateArticleImage,
    getAuthorsByUserName,
    getSubscribersByUserName,
    getProfileByName,
    checkSubscription,
    createNewSubscribe,
    deleteSubscribe
}