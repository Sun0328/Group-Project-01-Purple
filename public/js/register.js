window.addEventListener("load",  function () {
    let input = document.getElementById("textUsername");
    input.oninput = async function() {
        const testUsername = input.value;
        console.log("testusername: " + testUsername);
        const response =await fetch(`./testUsername?username=${testUsername}`);
        const message = await response.json();
        console.log("message: " + JSON.stringify(message));
        if (message === "same")
        {
            const warning = document.createElement("p");
            warning.innerHTML = "The username already exists";
            const warningArea = document.querySelector(".warningUsernameArea");
            warningArea.innerHTML = '';
            warningArea.appendChild(warning);
        }
        else if (message === "unique")
        {
            const warning = document.createElement("p");
            warning.innerHTML = "The username is unique";
            const warningArea = document.querySelector(".warningUsernameArea");
            warningArea.innerHTML = '';
            warningArea.appendChild(warning);
        }
      };
});