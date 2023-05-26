window.addEventListener("load", function () {

    let paragraph = document.querySelector('.content .text p');

    let showMoreButton = document.getElementById(2);

    // Calculate the line height
    let lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);

    // Calculate the maximum height for 5 lines
    let maxHeight = lineHeight * 5;

    // Check if the paragraph has more than 5 lines
    if (paragraph.scrollHeight > maxHeight) {
        showMoreButton.style.display = 'block';
        console.log("block");
    } else {
        showMoreButton.style.display = 'none';
        console.log("none");
    }

    
    console.log(showMoreButton);
})