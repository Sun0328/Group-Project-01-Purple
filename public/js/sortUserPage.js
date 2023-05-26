document.addEventListener("DOMContentLoaded", function () {
    // Get the select element
    const selectElement = document.getElementById("mySelect");

    // Add event listener for click event
    selectElement.addEventListener("change", function () {
        // Get the selected option value
        var selectedOption = selectElement.value;

        // Redirect to the selected URL
        if (selectedOption !== "") {
            window.location.href = selectedOption;
        }
    });

    // Update selected option based on current URL
    let currentURL = window.location.href;
    let options = selectElement.options;

    // options.addEventListener("click", function () {
    //     let selectedValue = this.value;
    //     if (selectedValue === currentURL) { this.selected = true; }
    // })

});