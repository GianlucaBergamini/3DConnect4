function initGUI() {
    startMenu.style.display = "none";
    canvas.style.webkitFilter = "";
    const instructions = document.getElementById("instructions");
    instructions.style.display = "block"
}

function playerWon(player) {
    if (!someoneWon) {
        const instructions = document.getElementById("instructions");
        instructions.style.display = "none"
        const winMessage = document.getElementById("winMessage");
        const message = document.getElementById("message");
        const restartButton = document.getElementById("restartButton");
        const dismissButton = document.getElementById("dismissButton");
        message.textContent = "The player with the " + player + " discs wins!"
        winMessage.style.display = "block";
        restartButton.addEventListener("click", function () {
            location.reload()
        }, false)
        dismissButton.addEventListener("click", function () {
            winMessage.style.display = "none"
            instructions.style.display = "block"
        }, false)
        someoneWon = true
    }
}

function tie() {
    const instructions = document.getElementById("instructions");
    instructions.style.display = "none"
    const tieMessage = document.getElementById("winMessage");
    const message = document.getElementById("message");
    const restartButton = document.getElementById("restartButton")
    const dismissButton = document.getElementById("dismissButton")
    message.textContent = "Tie!"
    tieMessage.style.display = "block";
    restartButton.addEventListener("click", function () {
        location.reload()
    }, false)
    dismissButton.addEventListener("click", function () {
        tieMessage.style.display = "none"
    }, false)
    gameStarted = false;
}