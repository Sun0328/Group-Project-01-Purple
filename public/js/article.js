window.addEventListener("load", function () {
    const cookie = document.cookie;
    let currentUsername;
    const usernameRegex = /username=([^;]+)/;
    const match = cookie.match(usernameRegex);

    if (match) {
      currentUsername = match[1];
      console.log("current user: " + currentUsername);
    }

    // show dele button or not
    const articleAuthorArea = document.querySelector("#articleAuthor");
    const articleAuthor = articleAuthorArea.textContent;
        
    const deleButtonArray = document.querySelectorAll(".deleCommentButton");
    for (let i = 0; i < deleButtonArray.length; i++)
    {
        const currentButton = deleButtonArray[i];
        const deleCommentUsername = currentButton.value;
        console.log("dele comment username: " + deleCommentUsername);
        if (currentUsername == deleCommentUsername)
        {
            currentButton.style.display = "block";
        }
        else if (articleAuthor == currentUsername)
        {
            currentButton.style.display = "block";
        }
    }

    document.addEventListener('click',async function(event) {

        //submit comment to article
        if (event.target.id === 'commentButton'){
            const commentButton = event.target;
            let textarea = event.target.previousElementSibling;
            const commentContent = textarea.value;
            const articleId = document.querySelector("#articleId").value;
            const recipientCommentId = null;
        
            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}`);
            const json = await response.json();
            location.reload();
        }

        //del comment
        if (event.target.classList.contains("deleCommentButton")){
            const deleButton = event.target;
            const deleCommentId = deleButton.previousElementSibling.value;

            const response = await fetch(`./article/deleComment?deleCommentId=${deleCommentId}`);
            await response.text();
            console.log("dele");
            location.reload();
        }

        // show or hidden the textarea button
        if (event.target.classList.contains("showSecondSubmitTextarea")){
            let currentButton = event.target;
            let addSubmitArea = '<label for="secondTextComment">Submit Comment:</label><br/>' +
            '<textarea class="secondTextComment" name="comment" row="4" cols="50"></textarea>' +
            '<button type="submit" class="secondCommentButton">send</button>';
            currentButton.insertAdjacentHTML('afterend', addSubmitArea);
            currentButton.remove();
        }
        else if (event.target.classList.contains("showThirdSubmitTextarea")){
            let currentButton = event.target;
            let addSubmitArea = '<label for="thirdTextComment">Submit Comment:</label><br/>' +
            '<textarea class="thirdTextComment" name="comment" row="4" cols="50"></textarea>' +
            '<button type="submit" class="thirdCommentButton">send</button>';
            currentButton.insertAdjacentHTML('afterend', addSubmitArea);
            currentButton.remove();
        }
        else if (event.target.classList.contains("showOtherSubmitTextarea")){
            let currentButton = event.target;
            let addSubmitArea = '<label for="otherTextComment">Submit Comment:</label><br/>' +
            '<textarea class="otherTextComment" name="comment" row="4" cols="50"></textarea>' +
            '<button type="submit" class="otherCommentButton">send</button>';
            currentButton.insertAdjacentHTML('afterend', addSubmitArea);
            currentButton.remove();
        }

        // comment textarea js code
        if (event.target.classList.contains("secondCommentButton")) {
            let textarea = event.target.previousElementSibling;
            const commentContent = textarea.value;
            console.log("current second comment: " + commentContent);
            const recipientCommentId = document.querySelector(".secondReciptientCommentId").value;
            const articleId = document.querySelector("#articleId").value;
            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}&recipientCommentId=${recipientCommentId}`);
            const json = await response.json();
            location.reload();
        }
        else if (event.target.classList.contains("thirdCommentButton")){
            let textarea = event.target.previousElementSibling;
            const commentContent = textarea.value;
            console.log("current third comment: " + commentContent);
            
            const recipientCommentId = document.querySelector(".thirdReciptientCommentId").value;
            
            const articleId = document.querySelector("#articleId").value;
            
            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}&recipientCommentId=${recipientCommentId}`);
            const json = await response.json();
            location.reload();
        }
        else if (event.target.classList.contains("otherCommentButton")){
            let textarea = event.target.previousElementSibling;
            const commentContent = textarea.value;
            console.log("current other comment: " + commentContent);
            
            const recipientCommentId = document.querySelector(".otherReciptientCommentId").value;

            const articleId = document.querySelector("#articleId").value;
            
            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}&recipientCommentId=${recipientCommentId}`);
            const json = await response.json();
            location.reload();
        }
    })
})