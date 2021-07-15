let program;
let skyProgram;
let gl;
let shaderDir;
let baseDir;
const COINS = 130;

let cx = 0.0;
let cy = 0.0;
let cz = 0.0;
let elevation = -20.0;
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
let gameStarted = false;
let someoneWon = false;

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

const ambientLight = [0.1, 0.1, 0.1];
const tableSpecularColor = [1.0, 1.0, 1.0];
const lightCoinSpecularColor = [127.0/255, 127.0/255, 127.0/255];
const darkCoinSpecularColor = [0.0, 0.0, 0.0];
const baseSpecularColor = [63.0/255, 63.0/255, 63.0/255];
const baseSpecularPower = 100.0;
const coinSpecularPower = 50.0;
const tableSpecularPower = 5.0;

async function main() {

    let positionBuffer;
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // vertex shader
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    const normalsLocation = gl.getAttribLocation(program, "inNormal");
    const matrixLocation = gl.getUniformLocation(program, "matrix");
    const normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
    const positionMatrixHandle = gl.getUniformLocation(program, 'pMatrix');

    // fragment shader
    const textLocation = gl.getUniformLocation(program, "u_texture");
    const dirLight1DirectionHandle = gl.getUniformLocation(program, 'dirLight1Direction');
    const dirLight1ColorHandle = gl.getUniformLocation(program, 'dirLight1Color');
    const dirLight2DirectionHandle = gl.getUniformLocation(program, 'dirLight2Direction');
    const dirLight2ColorHandle = gl.getUniformLocation(program, 'dirLight2Color');
    const ambLightCoeffHandle = gl.getUniformLocation(program, 'ambientLightCoeff');
    const ambLightColorHandle = gl.getUniformLocation(program, 'ambientColor');
    const mSpecColorHandle = gl.getUniformLocation(program, 'mSpecColor');
    const mSpecPowerHandle = gl.getUniformLocation(program, 'mSpecPower');

    // skybox shaders
    const skyboxTexHandle = gl.getUniformLocation(skyProgram, "u_texture");
    const inverseViewProjMatrixHandle = gl.getUniformLocation(skyProgram, "inverseViewProjMatrix");
    const skyboxVertPosAttr = gl.getAttribLocation(skyProgram, "in_position");

    gl.useProgram(program);

    function initBuffers(mesh) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        const normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(normalsLocation);
        gl.vertexAttribPointer(normalsLocation, 3, gl.FLOAT, false, 0, 0);

        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(uvAttributeLocation);
        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    }

    //////////// LOAD BASE

    const base = gl.createVertexArray();
    gl.bindVertexArray(base);
    const baseStr = await utils.get_objstr("assets/objs/3DConnect4base.obj");
    let baseMesh = new OBJ.Mesh(baseStr);
    initBuffers(baseMesh);

    ///////// LOAD COINS

    const coin = gl.createVertexArray();
    gl.bindVertexArray(coin);
    const coinStr = await utils.get_objstr("assets/objs/3DConnect4coin.obj");
    let coinMesh = new OBJ.Mesh(coinStr);
    initBuffers(coinMesh)

    ////////// LOAD TABLE

    const table = gl.createVertexArray();
    gl.bindVertexArray(table);
    const tableStr = await utils.get_objstr("assets/objs/3DConnect4table.obj");
    let tableMesh = new OBJ.Mesh(tableStr);
    initBuffers(tableMesh);

    //////////// CREATE CUBE MAP AND LOAD ITS TEXTURES

    gl.useProgram(skyProgram);
    let skyboxVertPos = new Float32Array(
        [
            -1, -1, 1.0,
            1, -1, 1.0,
            -1, 1, 1.0,
            -1, 1, 1.0,
            1, -1, 1.0,
            1, 1, 1.0,
        ]);

    let skyboxVao = gl.createVertexArray();
    gl.bindVertexArray(skyboxVao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, skyboxVertPos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(skyboxVertPosAttr);
    gl.vertexAttribPointer(skyboxVertPosAttr, 3, gl.FLOAT, false, 0, 0);

    let skyboxTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0+3);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

    const envTexDir = baseDir + "assets/env/";

    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: envTexDir+'posx.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: envTexDir+'negx.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: envTexDir+'posy.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: envTexDir+'negy.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: envTexDir+'posz.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: envTexDir+'negz.jpg',
        },
    ];
    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 2048;
        const height = 2048;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
            // Now that the image has loaded upload it to the texture.
            gl.activeTexture(gl.TEXTURE0+3);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(target, level, internalFormat, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });


    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);


    ///////////////// LOAD TEXTURES //////////////////////

    gl.useProgram(program);
    let textures = []
    let images = [
        "assets/textures/WoodM1.jpg",
        "assets/textures/WoodL1.png",
        "assets/textures/WoodD1.jpg",
        "assets/textures/table.jpg"
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

            for (let i=0; i<images.length; i++)
                if ((image1.src).includes(images[i])) {
                    textures[i] = texture
                    break;
                }
        };
    }

    drawScene();

    function animate() {
        const currentTime = (new Date).getTime();

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

        gl.useProgram(program)
        let baseWorldMatrix = utils.MakeWorld(0.0, -baseHeight, 0.0, basePosition[0], basePosition[1], basePosition[2], baseS);
        let tableWorldMatrix = utils.MakeWorld(0.0, -0.41, 0.0, 90.0, 0.0, 0.0, 1.0);

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
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);


        const aspectRatio = gl.canvas.width / gl.canvas.height;
        const nearPlane = 0.01;
        const farPlane = 100.0;
        const perspectiveMatrix = utils.MakePerspective(fieldOfView, aspectRatio, nearPlane, farPlane);

        cz = lookRadius * Math.cos(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cx = lookRadius * Math.sin(utils.degToRad(-angle)) * Math.cos(utils.degToRad(-elevation));
        cy = lookRadius * Math.sin(utils.degToRad(-elevation));
        const viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[1]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures[2]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, textures[3]);

        //////////// LIGHTS ///////////////

        //define directional light
        const directionalLight1 = [Math.cos(geta1()) * Math.cos(getb1()),
            Math.sin(geta1()),
            Math.cos(geta1()) * Math.sin(getb1())
        ];

        const directionalLight2 = [Math.cos(geta2()) * Math.cos(getb2()),
            Math.sin(geta2()),
            Math.cos(geta2()) * Math.sin(getb2())
        ];

        const dirLight1Transformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(utils.invertMatrix(utils.transposeMatrix(viewMatrix))), directionalLight1);
        gl.uniform3fv(dirLight1DirectionHandle, dirLight1Transformed)
        gl.uniform3fv(dirLight1ColorHandle, get1col())

        const dirLight2Transformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(utils.invertMatrix(utils.transposeMatrix(viewMatrix))), directionalLight2);
        gl.uniform3fv(dirLight2DirectionHandle, dirLight2Transformed)
        gl.uniform3fv(dirLight2ColorHandle, get2col())

        gl.uniform3fv(ambLightCoeffHandle, ambientLight)
        gl.uniform3fv(ambLightColorHandle, getAmbCol())

        //////////// BASE /////////////////
        var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, baseWorldMatrix);
        var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

        let baseNormalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
        gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(baseNormalMatrix));
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(positionMatrixHandle, gl.FALSE, baseWorldMatrix);

        gl.uniform1f(mSpecPowerHandle, baseSpecularPower)
        gl.uniform3fv(mSpecColorHandle, baseSpecularColor)
        gl.uniform1i(textLocation, 0);

        gl.bindVertexArray(base);
        gl.drawElements(gl.TRIANGLES, baseMesh.indices.length, gl.UNSIGNED_SHORT, 0);

        ///////////// TABLE
        var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, tableWorldMatrix);
        var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

        let tableNormalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
        gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(tableNormalMatrix));
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
        gl.uniformMatrix4fv(positionMatrixHandle, gl.FALSE, tableWorldMatrix);

        gl.uniform1f(mSpecPowerHandle, tableSpecularPower);
        gl.uniform3fv(mSpecColorHandle, tableSpecularColor)

        gl.uniform1i(textLocation, 3);

        gl.bindVertexArray(table);
        gl.drawElements(gl.TRIANGLES, tableMesh.indices.length, gl.UNSIGNED_SHORT, 0);

        //////////// COINS /////////////////
        for (let i=0; i<COINS; i++) {
            viewWorldMatrix = utils.multiplyMatrices(viewMatrix, coinWorldMatrix[i]);
            projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            let coinNormalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
            gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(coinNormalMatrix));
            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
            gl.uniformMatrix4fv(positionMatrixHandle, gl.FALSE, coinWorldMatrix[i]);
            gl.uniform1f(mSpecPowerHandle, coinSpecularPower);

            if (i%2 === 0) {
                gl.uniform1i(textLocation, 1)
                gl.uniform3fv(mSpecColorHandle, lightCoinSpecularColor)
            } else {
                gl.uniform1i(textLocation, 2)
                gl.uniform3fv(mSpecColorHandle, darkCoinSpecularColor)
            }

            gl.bindVertexArray(coin);
            gl.drawElements(gl.TRIANGLES, coinMesh.indices.length, gl.UNSIGNED_SHORT, 0 );
        }

        ///////////// SKYBOX

        gl.useProgram(skyProgram);

        gl.activeTexture(gl.TEXTURE0+3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
        gl.uniform1i(skyboxTexHandle, 3);

        const viewProjMat = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
        let inverseViewProjMatrix = utils.invertMatrix(viewProjMat);
        gl.uniformMatrix4fv(inverseViewProjMatrixHandle, gl.FALSE, utils.transposeMatrix(inverseViewProjMatrix));

        gl.bindVertexArray(skyboxVao);
        gl.depthFunc(gl.LEQUAL);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //////////////

        window.requestAnimationFrame(drawScene);
    }
}

async function init(){

    gameStarted = false;
    const path = window.location.pathname;
    const page = path.split("/").pop();
    baseDir = path.replace(page, '');
    shaderDir = baseDir+"lib/shaders/";

    var canvas = document.getElementById("canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }

    canvas.style.webkitFilter = "blur(10px)"

    var startMenu = document.getElementById("startMenu")
    var startButton = document.getElementById("startButton");
    startButton.addEventListener("click", startGame, false);


    function startGame() {

        gameStarted = true;

        initGUI();
        startTurn();
    }

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", doMouseUp, false);
    canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("wheel", doMouseWheel, false);
    window.addEventListener("keydown", keyPressed, false);

    canw = canvas.clientWidth;
    canh = canvas.clientHeight;

    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl', shaderDir + 'skyvs.glsl', shaderDir + 'skyfs.glsl'], function (shaderText) {
        console.log(shaderText[0])
        console.log(shaderText[1])
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        var skyVertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[2]);
        var skyFragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[3])
        program = utils.createProgram(gl, vertexShader, fragmentShader);
        skyProgram = utils.createProgram(gl, skyVertexShader, skyFragmentShader);

    });

    currentGame = new Game();
    currentCoin = 0;
    initialPositioning();
    await main();
}

function startTurn() {
    for (let i=-2; i<=2; i++)
        for (let j=-2; j<=2; j++)
            if (checkFree(i, j))
                coinPosition[currentCoin] = [i, 6.125, j]
}

function initialPositioning() {
    for (let i=0; i<COINS; i += 2)
        coinPosition[i] = [-10 + (i / 26), -(baseHeight + 0.065) * 10, 6.50 - (0.50 * (i % 26.0))]


    for (let i=1; i<COINS; i += 2)
        coinPosition[i] = [10 - (i / 26), -(baseHeight + 0.065) * 10, 6.50 - (0.50 * (i % 26.0))]

}

let mouseState = false;
let lastMouseX = -100, lastMouseY = -100;

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
        const dx = event.pageX - lastMouseX;
        const dy = lastMouseY - event.pageY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if((dx !== 0) || (dy !== 0)) {
            angle = angle + 0.5 * dx;
            elevation = elevation + 0.5 * dy;
        }

        while (angle < 0)
            angle = angle + 360

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
    setTimeout(change, 10)

    function change() {
        if (!fallAnimationOn) {
            currentCoin++;
            startTurn()
        } else changeTurn()
    }
}

function keyPressed(event) {
    if (fallAnimationOn || !gameStarted) return;
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


