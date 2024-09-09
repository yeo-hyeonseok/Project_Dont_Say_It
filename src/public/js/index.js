const socket = io();

/* room */
const exitButton = document.querySelector("span.exit_button");

exitButton.addEventListener("click", () => history.back());
