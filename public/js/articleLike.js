window.addEventListener("load", function () {
    let likeStateArray = document.querySelectorAll(".likeSpan");
    console.log(likeStateArray);
    likeStateArray.forEach(element => {
        console.log(element.textContent);
        if (element.textContent == "Unlike") {
            const like_container = element.parentNode;
            like_container.classList.add("like_status");
        }
    });

    document.addEventListener('click', async function (event) {
        if (event.target.classList.contains("likeSpan")) {
            let currentLikeSpan = event.target;
            const likeState = currentLikeSpan.textContent;

            const likeContainer = currentLikeSpan.parentNode;
            const articleId = likeContainer.getAttribute('id');

            const likeNumberSpan = likeContainer.querySelector(".likeNumber");
            let likeNumber = likeNumberSpan.textContent;
            likeNumber = parseInt(likeNumber, 10);

            if (likeState == "Like") {
                console.log("click like");
                const response = await fetch(`../addLike?articleId=${articleId}`);
                const json = await response.json();
                currentLikeSpan.innerHTML = "Unlike";
                const number = likeNumber + 1;
                likeNumberSpan.innerHTML = "";
                likeNumberSpan.innerHTML = number;

                // Change the color and background color if click like
                likeContainer.classList.add("like_status")
            }
            else if (likeState == "Unlike") {
                console.log("click cancel");
                const response = await fetch(`../cancelLike?articleId=${articleId}`);
                const json = await response.json();
                currentLikeSpan.innerHTML = "Like";
                const number = likeNumber - 1;
                likeNumberSpan.innerHTML = "";
                likeNumberSpan.innerHTML = number;

                // Change the color and background color if click like
                likeContainer.classList.remove("like_status");
            }
        }
    })

    // const likeContainerArray = document.querySelectorAll(".like_container");
    // console.log(likeContainerArray);

})