window.addEventListener("load", function () {

    const commentButton = document.querySelector("#commentButton");
    commentButton.addEventListener("click", async function(event){
        const commentContent = document.querySelector("#textComment").value;
        const articleId = document.querySelector("#articleId").value;
        const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}`);
        console.log(response);
        const json = await response.json();
        console.log("json:"+JSON.stringify(json));

        const commentData = JSON.stringify(json);
        location.reload();
    })
})