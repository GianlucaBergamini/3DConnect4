const instructions = document.getElementById("instructions");
const settingsButton = document.getElementById("settingsButton");
const winMessage = document.getElementById("winMessage");
const message = document.getElementById("message");
const restartButton = document.getElementById("restartButton");
const dismissButton = document.getElementById("dismissButton");
const tieMessage = document.getElementById("winMessage");
const settings = document.getElementById("settings");
const backToInstr = document.getElementById("back");
const ambColorPicker = document.getElementById("ambColor")
const dir1Color = document.getElementById("dir1Color")
const dir2Color = document.getElementById("dir2Color")
const dir1a = document.getElementById("1a")
const dir1b = document.getElementById("1b")
const dir2a = document.getElementById("2a")
const dir2b = document.getElementById("2b")

function initGUI() {
    startMenu.style.display = "none";
    canvas.style.webkitFilter = "";
    instructions.style.display = "block"
    settingsButton.addEventListener("click", function () {
        instructions.style.display = "none"
        showSettings()
    }, false)
}

function showSettings() {
    settings.style.display = "block";

    backToInstr.addEventListener("click", function () {
        settings.style.display = "none"
        initGUI()
    }, false)
}

function geta1() {
    return Math.PI/180 * dir1a.value
}
function getb1() {
    return Math.PI/180 * dir1b.value
}
function geta2() {
    return Math.PI/180 * dir2a.value
}
function getb2() {
    return Math.PI/180 * dir2b.value
}
function getAmbCol() {
    return hexToRGB(ambColorPicker.value)
}
function get1col() {
    return hexToRGB(dir1Color.value)
}
function get2col() {
    return hexToRGB(dir2Color.value)
}

function hexToRGB(h) {
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (h.length === 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

        // 6 digits
    } else if (h.length === 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }
    return [r/255, g/255, b/255];
}

function playerWon(player) {
    if (!someoneWon) {
        instructions.style.display = "none"
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
    instructions.style.display = "none"
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