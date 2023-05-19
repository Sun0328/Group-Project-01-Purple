const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function retrieveAllData() {
    const db = await dbPromise;
    
    const allTestData = await db.all(SQL`select * from likes`);

    return allTestData;
}


// All functions below need to be changed
async function deleteData(id, table) {
    const db = await dbPromise;

    return await db.run(SQL`
        delete from ${table}
        where id = ${id}`);
}
async function createNewUser(user) {
    const db = await dbPromise;

    return await db.run(SQL`
        insert into user (id, username, password, fname, lname, year, month, day, salt, profile, avatar, subscriber) values
        (${user.id, user.username, user.password, user.fname, user.lname, user.year, user.month, user.day, user.salt, user.profile, user.avatar, user.subscriber})`);
}
async function retrieveDataById(id, table) {
    const db = await dbPromise;

    const testData = await db.get(SQL`
        select * from ${table}
        where id = ${id}`);

    return testData;
}


async function retrieveAllData(item) {
    const db = await dbPromise;
    const table = item;

    const allTestData = await db.all(SQL`select * from ${table}`);
    return allTestData;
}



async function updateData(data, table, column) {
    const db = await dbPromise;

    return await db.run(SQL`
        update ${table}
        set ${column} = ${data.column}
        where id = ${data.id}`);
}

// Export functions.
module.exports = {
    createNewUser,
    retrieveDataById,
    retrieveAllData,
    updateData,
    deleteData

};
