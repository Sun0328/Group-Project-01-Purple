window.addEventListener("load", function () {
    document.addEventListener('click', async function(event){
        if (event.target.classList.contains("likeSpan")){
            let currentLikeSpan = event.target;
            const likeState = currentLikeSpan.textContent;

            const likeContainer = currentLikeSpan.parentNode;
            const articleId = likeContainer.getAttribute('id');

            const likeNumberSpan = likeContainer.querySelector(".likeNumber");
            let likeNumber = likeNumberSpan.textContent;
            likeNumber = parseInt(likeNumber, 10);
            if (likeState == "Like")
            {
                console.log("click like");
                const response = await fetch(`./addLike?articleId=${articleId}`);
                const json = await response.json();
                currentLikeSpan.innerHTML = "cancel Like";
                const number = likeNumber + 1;
                likeNumberSpan.innerHTML = "";
                likeNumberSpan.innerHTML = number;
            }
            else if (likeState == "cancel Like")
            {
                console.log("click cancel");
                const response = await fetch(`./cancelLike?articleId=${articleId}`);
                const json = await response.json();
                currentLikeSpan.innerHTML = "Like";
                const number = likeNumber - 1;
                likeNumberSpan.innerHTML = "";
                likeNumberSpan.innerHTML = number;
            }
        }
    })
})