// Compare and reorder array

function compareByHeader(a, b) {
    if (a.header < b.header) {
        return -1;
    }
    if (a.header > b.header) {
        return 1;
    }
    return 0;
}

function compareByAuthor(a, b) {
    if (a.username < b.username) {
        return -1;
    }
    if (a.username > b.username) {
        return 1;
    }
    return 0;
}

function compareByDate(a, b) {
    if (a.date < b.date) {
        return 1;
    }
    if (a.date > b.date) {
        return -1;
    }
    return 0;
}


module.exports = {
    compareByHeader,
    compareByAuthor,
    compareByDate

}
