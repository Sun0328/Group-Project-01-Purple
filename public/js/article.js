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
    for (let i = 0; i < deleButtonArray.length; i++) {
        const currentButton = deleButtonArray[i];
        const deleCommentUsername = currentButton.value;
        console.log("dele comment username: " + deleCommentUsername);
        if (currentUsername == deleCommentUsername) {
            currentButton.style.display = "block";
        }
        else if (articleAuthor == currentUsername) {
            currentButton.style.display = "block";
        }
    }

    // Show or Hide comments history
    const history = document.getElementById("history");

    if (history !== null) {
        const show = document.getElementById("show");
        const hide = document.getElementById("hide");
        const comment_detail = document.getElementById("comment_detail");
        show.addEventListener("click", function () {
            comment_detail.style.display = "block"
            this.style.display = "none"
            hide.style.display = "block"
        })

        hide.addEventListener("click", function () {
            comment_detail.style.display = "none"
            this.style.display = "none"
            show.style.display = "block"
        })
    }


    document.addEventListener('click', async function (event) {

        //submit comment to article
        if (event.target.id === 'commentButton') {
            console.log("test");
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
        if (event.target.classList.contains("deleCommentButton")) {
            const deleButton = event.target;
            const deleCommentId = deleButton.previousElementSibling.value;

            const response = await fetch(`./article/deleComment?deleCommentId=${deleCommentId}`);
            await response.text();
            console.log("dele");
            location.reload();
        }

        // show or hidden the textarea button
        if (event.target.classList.contains("showSecondSubmitTextarea")) {
            let currentButton = event.target;
            let addSubmitArea = '<label for="secondTextComment" style="margin-top: 20px">Reply:</label>' +
                '<textarea class="secondTextComment" name="comment" row="4" cols="30" maxlength="108"></textarea>' +
                '<button type="submit" class="secondCommentButton">Send</button>';
            currentButton.insertAdjacentHTML('afterend', addSubmitArea);
            currentButton.remove();
        }
        else if (event.target.classList.contains("showThirdSubmitTextarea")) {
            let currentButton = event.target;
            let addSubmitArea = '<label for="thirdTextComment" style="margin-top: 20px">Reply:</label>' +
                '<textarea class="thirdTextComment" name="comment" row="4" cols="30" maxlength="108"></textarea>' +
                '<button type="submit" class="thirdCommentButton">Send</button>';
            currentButton.insertAdjacentHTML('afterend', addSubmitArea);
            currentButton.remove();
        }
        else if (event.target.classList.contains("showOtherSubmitTextarea")) {
            let currentButton = event.target;
            let addSubmitArea = '<label for="otherTextComment" style="margin-top: 20px">Reply:</label>' +
                '<textarea class="otherTextComment" name="comment" row="4" cols="30" maxlength="108"></textarea>' +
                '<button type="submit" class="otherCommentButton">Send</button>';
            currentButton.insertAdjacentHTML('afterend', addSubmitArea);
            currentButton.remove();
        }

        // comment textarea js code
        if (event.target.classList.contains("secondCommentButton")) {
            const secondCommentButton = event.target;
            const secondSubmitContainer = secondCommentButton.parentNode;
            const textarea = secondSubmitContainer.querySelector(".secondTextComment");
            const commentContent = textarea.value;
            console.log("current second comment: " + commentContent);
            const recipientCommentId = secondSubmitContainer.querySelector(".secondReciptientCommentId").value;
            console.log("recipientCommentId: " + recipientCommentId);
            const articleId = document.querySelector("#articleId").value;
            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}&recipientCommentId=${recipientCommentId}`);
            const json = await response.json();
            location.reload();
        }
        else if (event.target.classList.contains("thirdCommentButton")) {
            const thirdCommentButton = event.target;
            const thirdSubmitContainer = thirdCommentButton.parentNode;

            const textarea = thirdSubmitContainer.querySelector(".thirdTextComment")
            const commentContent = textarea.value;
            console.log("current third comment: " + commentContent);

            const recipientCommentId = thirdSubmitContainer.querySelector(".thirdReciptientCommentId").value;

            const articleId = document.querySelector("#articleId").value;

            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}&recipientCommentId=${recipientCommentId}`);
            const json = await response.json();
            location.reload();
        }
        else if (event.target.classList.contains("otherCommentButton")) {
            const otherCommentButton = event.target;
            const otherSubmitContainer = otherCommentButton.parentNode;
            const textarea = otherSubmitContainer.querySelector(".otherTextComment");
            const commentContent = textarea.value;
            console.log("current other comment: " + commentContent);

            const recipientCommentId = otherSubmitContainer.querySelector(".otherReciptientCommentId").value;

            const articleId = document.querySelector("#articleId").value;

            const response = await fetch(`./article/comment?commentContent=${commentContent}&articleId=${articleId}&recipientCommentId=${recipientCommentId}`);
            const json = await response.json();
            location.reload();
        }
    })
})