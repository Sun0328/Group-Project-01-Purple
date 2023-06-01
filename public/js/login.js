window.addEventListener("load", function () {

    const toastMessage = document.getElementById("toastMessage");

    if (toastMessage.innerText == "You have successfully registered") {
        toastMessage.style.color = "black";

    } else {
        toastMessage.style.color = "red";
    }


})
