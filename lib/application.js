let program;
let gl;
let shaderDir;
let baseDir;
const COINS = 130;

let cx = 0.0;
let cy = 0.0;
let cz = 0.0;
let elevation = 0.0;
let angle = 0.0;
let lookRadius = 0.5;
let fieldOfView = 50;

const pinOffset = 0.05;
const coinHeight = 0.02;
const baseHeight = 0.02;

basePosition = [0.0, 0.0, 0.0]
baseS = 1

coinPosition = [[]]
for (let i=0; i<COINS; i++)
    coinPosition[i] = [0, 0, 0];
coinS = 1

let currentCoin = 0;
let currentGame;

let moveAnimationOn = false
let moveStarted = false;
let moveDestPos = []
let moveStartPos = []
let movePosition = []
let moveStartTime
let moveDuration = 250 //in milliseconds

let fallStarted = false
let fallAnimationOn = false
let fallHeight
let fallStartHeight = coinPosition[currentCoin][1]
let fallDestHeight
let fallStartTime
let gravity = 0.0000981 // in m / s^2

async function main() {

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var textLocation = gl.getUniformLocation(program, "u_texture");

    //////////// LOAD BASE
    {
    var base = gl.createVertexArray();
    gl.bindVertexArray(base);

    const baseStr = await utils.get_objstr("assets/objs/3DConnect4base.obj");
    baseMesh = new OBJ.Mesh(baseStr);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baseMesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baseMesh.vertexNormals), gl.STATIC_DRAW);
    //gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset);
    //gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baseMesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(baseMesh.indices), gl.STATIC_DRAW);
    }

    ///////// LOAD COINS

    var coin = gl.createVertexArray();
    gl.bindVertexArray(coin);

    const coinStr = await utils.get_objstr("assets/objs/3DConnect4coin.obj");
    coinMesh = new OBJ.Mesh(coinStr);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coinMesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coinMesh.vertexNormals), gl.STATIC_DRAW);
    //gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset);
    //gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coinMesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coinMesh.indices), gl.STATIC_DRAW);

    ///////////////// LOAD TEXTURES //////////////////////

    let textures = []
    let images = [
        "assets/textures/WoodM1.jpg",
        "assets/textures/WoodL1.png",
        "assets/textures/WoodD1.jpg"
    ]

    for (const image of images) {
        // Asynchronously load an image
        const image1 = new Image();
        image1.src = image;
        image1.onload = function () {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.generateMipmap(gl.TEXTURE_2D);
            textures.push(texture)
        };
    }

    drawScene();

    function animate() {
        var currentTime = (new Date).getTime();

        if (moveAnimationOn && !moveStarted) {
            moveStarted = true
            moveAnimationOn = true
            moveStartTime = currentTime
            movePosition [0] = moveStartPos[0]
            movePosition [1] = moveStartPos[1]

        } else if (moveAnimationOn && moveStarted) {
            const t = (currentTime - moveStartTime) / moveDuration;
            movePosition [0] = lerp (moveStartPos[0], moveDestPos[0], t);
            movePosition [1] = lerp (moveStartPos[1], moveDestPos[1], t);

            if (currentTime >= moveStartTime + moveDuration) {
                moveStarted = false
                moveAnimationOn = false
            }
        }

        if (fallAnimationOn && !fallStarted) {
            fallAnimationOn = true
            fallStarted = true
            fallStartTime = currentTime
            fallHeight = fallStartHeight
        } else if (fallAnimationOn && fallStarted) {
            const t = currentTime - fallStartTime
            fallHeight = fallStartHeight - 1/2 * gravity * Math.pow(t, 2)

            if (fallHeight <= fallDestHeight) {
                fallStarted = false
                fallAnimationOn = false
            }
        }

    }

    function lerp(v0, v1, t) {
        return (1 - t) * v0 + t * v1;
    }


    function drawScene() {

        animate()

        let baseWorldMatrix = utils.MakeWorld(0.0, -baseHeight, 0.0, basePosition[0], basePosition[1], basePosition[2], baseS);

        const coinWorldMatrix = [];

        for (let i=0; i<COINS; i++) {
            if (i !== currentCoin || (moveAnimationOn === false && fallAnimationOn === false))
                coinWorldMatrix[i] = utils.MakeWorld(coinPosition[i][0] * pinOffset,coinPosition[i][1] * coinHeight, coinPosition[i][2] * pinOffset, 0.0, 0.0, 0.0, coinS);
            else if (moveAnimationOn)
                coinWorldMatrix[i] = utils.MakeWorld(movePosition[0] * pinOffset,coinPosition[i][1] * coinHeight, movePosition[1] * pinOffset, 0.0, 0.0, 0.0, coinS);
            else if (fallAnimationOn)
                coinWorldMatrix[i] = utils.MakeWorld(coinPosition[i][0] * pinOffset,fallHeight * coinHeight, coinPosition[i][2] * pinOffset, 0.0, 0.0, 0.0, coinS);
        }

        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        var aspectRatio = gl.canvas.width / gl.canvas.height; var nearPlane = 0.1; var farPlane = 100.0;
        var perspectiveMatrix = utils.MakePerspective(fieldOfView, aspectRatio, nearPlane, farPlane);

        cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cy = lookRadius * Math.sin(utils.degToRad(-elevation));
        var viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[1]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures[2]);


        //////////// BASE /////////////////
        var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, baseWorldMatrix);
        var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

        gl.uniform1i(textLocation, 0);

        gl.bindVertexArray(base);
        gl.drawElements(gl.TRIANGLES, baseMesh.indices.length, gl.UNSIGNED_SHORT, 0);

        //////////// COINS /////////////////
        for (let i=0; i<COINS; i++) {
            viewWorldMatrix = utils.multiplyMatrices(viewMatrix, coinWorldMatrix[i]);
            projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            //cubeNormalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
            (i%2 === 0) ? gl.uniform1i(textLocation, 1) : gl.uniform1i(textLocation, 2)
            //var dirLightTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(viewMatrix), directionalLight);
            //gl.uniform3fv(lightDirectionHandle,  dirLightTransformed);

            //gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
            //gl.uniform3fv(lightColorHandle,  directionalLightColor);

            gl.bindVertexArray(coin);
            gl.drawElements(gl.TRIANGLES, coinMesh.indices.length, gl.UNSIGNED_SHORT, 0 );
        }

        ////////////////////////////////////

        window.requestAnimationFrame(drawScene);
    }
}

async function init(){

    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = path.replace(page, '');
    shaderDir = baseDir+"lib/shaders/";

    var canvas = document.getElementById("c");
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", doMouseUp, false);
    canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("wheel", doMouseWheel, false);
    window.addEventListener("keydown", keyPressed, false);

    canw = canvas.clientWidth;
    canh = canvas.clientHeight;

    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }

    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);

    currentGame = new Game();
    currentCoin = 0;
    initialPositioning();
    startTurn();
    await main();
}

function startTurn() {
    for (let i=-2; i<=2; i++)
        for (let j=-2; j<=2; j++)
            if (checkFree(i, j))
                coinPosition[currentCoin] = [i, 6.5, j]
}

function initialPositioning() {
    for (let i=0; i<COINS; i += 2)
        coinPosition[i] = [-10 + (i / 26.0), -(baseHeight + 0.1) * 10, 5.00 - (0.50 * (i % 26.0))]


    for (let i=1; i<COINS; i += 2)
        coinPosition[i] = [10 - (i / 26.0), -(baseHeight + 0.1) * 10, 5.00 - (0.50 * (i % 26.0))]

}

var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;
function doMouseDown(event) {
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
    mouseState = true;
}
function doMouseUp(event) {
    lastMouseX = -100;
    lastMouseY = -100;
    mouseState = false;
}

let mult1 = 1;
let mult2 = 1;

function doMouseMove(event) {
    if(mouseState) {
        var dx = event.pageX - lastMouseX;
        var dy = lastMouseY - event.pageY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if((dx !== 0) || (dy !== 0)) {
            angle = angle + 0.5 * dx;
            elevation = elevation + 0.5 * dy;
        }

        let direction = angle % 360

        if (direction >= 315 || direction < 45) {
            mult1 = 1
            mult2 = 1
        } else if (direction >= 45 && direction < 135) {
            mult1 = 1
            mult2 = 0
        } else if (direction >= 135 && direction < 225) {
            mult1 = -1
            mult2 = 1
        } else if (direction >= 225 && direction < 315) {
            mult1 = -1
            mult2 = 0
        }
    }
}

function doMouseWheel(event) {
    const nLookRadius = fieldOfView + event.deltaY/2;

    if((nLookRadius > 20.0) && (nLookRadius < 100.0)) {
        fieldOfView = nLookRadius;
    }
}

function positionToNumber(x, z) {
    return ((x+2) + (z+2)*5)
}

function checkFree(a, b) {
    return (a >= -2 && a <= 2 && b >= -2 && b <= 2 && !currentGame.isComplete(positionToNumber(a, b)));
}

function changeTurn() {
    setTimeout(change, 500)
    function change() {
        currentCoin++;
        startTurn()
    }
}

function keyPressed(event) {
    if (fallAnimationOn) return;
    switch (event.key) {
        case "ArrowUp":
            if (mult2 === 1) {
                if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - mult1))
                    moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - mult1)
                    //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] - mult1
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - i * mult1)) {
                        moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - i * mult1)
                        //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] - i * mult1
                        break;
                    }
            } else {
                if (checkFree(coinPosition[currentCoin][0] + mult1, coinPosition[currentCoin][2]))
                    moveCoin(coinPosition[currentCoin][0] + mult1, coinPosition[currentCoin][2])
                    //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] + mult1
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0] + i * mult1, coinPosition[currentCoin][2])) {
                        //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] + i * mult1
                        moveCoin(coinPosition[currentCoin][0] + i * mult1, coinPosition[currentCoin][2])
                        break;
                    }
            }
            break;

        case "ArrowDown":
            if (mult2 === 1) {
                if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + mult1))
                    //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] + mult1
                    moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + mult1)
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + i * mult1)) {
                        //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] + i * mult1
                        moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + i * mult1)
                        break;
                    }
                //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] + mult1
            } else {
                if (checkFree(coinPosition[currentCoin][0] - mult1, coinPosition[currentCoin][2]))
                    //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] - mult1
                    moveCoin(coinPosition[currentCoin][0] - mult1, coinPosition[currentCoin][2])
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0] - i * mult1, coinPosition[currentCoin][2])) {
                        //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] - i * mult1
                        moveCoin(coinPosition[currentCoin][0] - i * mult1, coinPosition[currentCoin][2])
                        break;
                    }

                //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] - mult1;
            }
            break;

        case "ArrowLeft":
            if (mult2 === 1) {
                if (checkFree(coinPosition[currentCoin][0] - mult1, coinPosition[currentCoin][2]))
                    //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] - mult1
                    moveCoin(coinPosition[currentCoin][0] - mult1, coinPosition[currentCoin][2])
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0] - i * mult1, coinPosition[currentCoin][2])) {
                        moveCoin(coinPosition[currentCoin][0] - i * mult1, coinPosition[currentCoin][2])
                        //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] - i * mult1
                        break;
                    }
                //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] - mult1
            } else {
                if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - mult1))
                    moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - mult1)
                    //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] - mult1
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - i * mult1)) {
                        moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] - i * mult1)
                        //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] - i * mult1
                        break;
                    }
                //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] - mult1;
            }
            break;

        case "ArrowRight":
            if (mult2 === 1) {
                if (checkFree(coinPosition[currentCoin][0] + mult1, coinPosition[currentCoin][2]))
                    moveCoin(coinPosition[currentCoin][0] + mult1, coinPosition[currentCoin][2])
                    //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] + mult1
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0] + i * mult1, coinPosition[currentCoin][2])) {
                        moveCoin(coinPosition[currentCoin][0] + i * mult1, coinPosition[currentCoin][2])
                        //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] + i * mult1
                        break;
                    }
                //coinPosition[currentCoin][0] = coinPosition[currentCoin][0] + mult1
            } else {
                if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + mult1))
                    moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + mult1)
                    //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] + mult1
                else for (let i = 1; i < 6; i++)
                    if (checkFree(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + i * mult1)) {
                        moveCoin(coinPosition[currentCoin][0], coinPosition[currentCoin][2] + i * mult1)
                        //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] + i * mult1
                        break;
                    }
                //coinPosition[currentCoin][2] = coinPosition[currentCoin][2] + mult1;
            }
            break;

        case "Enter":
            if (coinPosition[currentCoin][0] === -2 && coinPosition[currentCoin][2] === -3) break;
            coinFall(currentGame.getLastOccupiedLevel(positionToNumber(coinPosition[currentCoin][0], coinPosition[currentCoin][2]))+1)
            currentGame.addCoin(positionToNumber(coinPosition[currentCoin][0], coinPosition[currentCoin][2]))
            changeTurn();
            break;

    }
}

function moveCoin(destPos0, destPos2) {
    moveStarted = false
    moveAnimationOn = true

    moveStartPos = [coinPosition[currentCoin][0], coinPosition[currentCoin][2]];
    moveDestPos = [destPos0, destPos2];

    coinPosition[currentCoin][0] = destPos0;
    coinPosition[currentCoin][2] = destPos2;
}

function coinFall(destHeight) {
    fallStarted = false
    fallAnimationOn = true

    fallStartHeight = coinPosition[currentCoin][1]
    fallDestHeight = destHeight

    coinPosition[currentCoin][1] = destHeight
}

window.onload = init;


