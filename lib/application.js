let program;
let skyProgram;
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

const dirLightAlpha = -utils.degToRad(-60);
const dirLightBeta = -utils.degToRad(-60);
const directionalLightColor = [1.0, 1.0, 1.0];
const ambientLight = [0.1, 0.1, 0.1];
const ambientLightColor = [1.0, 1.0, 1.0];
const specularColor = [1.0, 1.0, 1.0];
const specularPower = 50.0;
const innerCone = 60.0;
const outerCone = 120.0;
const spot1Pos = [-10.0, 1.0, 0.0];
const spot1Dir = [10.0, -1.0, 0.0];
const spot1Color = [1.0, 1.0, 1.0];
const spot2Pos = [5.0, 1.0, 0.0];
const spot2Dir = [-5.0, -1.0, 0.0];
const spot2Color = [1.0, 1.0, 1.0];
const spotLightTarget = 1.0;
const spotLightDecay = 5.0;

async function main() {

    let positionBuffer;
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // vertex shader
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var normalsLocation = gl.getAttribLocation(program, "inNormal");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');

    // fragment shader
    var textLocation = gl.getUniformLocation(program, "u_texture");
    var dirLightDirectionHandle = gl.getUniformLocation(program, 'dirLightDirection');
    var dirLightColorHandle = gl.getUniformLocation(program, 'dirLightColor');
    var ambLightCoeffHandle = gl.getUniformLocation(program, 'ambientLightCoeff');
    var ambLightColorHandle = gl.getUniformLocation(program, 'ambientColor');
    var spot1PositionHandle = gl.getUniformLocation(program, 'spotLight1Pos');
    var spot1DirectionHandle = gl.getUniformLocation(program, 'spotLight1Dir');
    var spot1LightColorHandle = gl.getUniformLocation(program, 'spotLight1Color');
    var spot2PositionHandle = gl.getUniformLocation(program, 'spotLight2Pos');
    var spot2DirectionHandle = gl.getUniformLocation(program, 'spotLight2Dir');
    var spot2LightColorHandle = gl.getUniformLocation(program, 'spotLight2Color');
    var spotTargetHandle = gl.getUniformLocation(program, 'spotLightTarget');
    var spotDecayHandle = gl.getUniformLocation(program, 'spotLightDecay');
    var mSpecColorHandle = gl.getUniformLocation(program, 'mSpecColor');
    var mSpecPowerHandle = gl.getUniformLocation(program, 'mSpecPower');
    var innerConeHandle = gl.getUniformLocation(program, 'innerCone');
    var outerConeHandle = gl.getUniformLocation(program, 'outerCone');

    // skybox shaders
    var skyboxTexHandle = gl.getUniformLocation(skyProgram, "u_texture");
    var inverseViewProjMatrixHandle = gl.getUniformLocation(skyProgram, "inverseViewProjMatrix");
    var skyboxVertPosAttr = gl.getAttribLocation(skyProgram, "in_position");

    //define directional light
    var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
        Math.sin(dirLightAlpha),
        Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
    ];

    gl.useProgram(program);
    //////////// LOAD BASE
    {
    var base = gl.createVertexArray();
    gl.bindVertexArray(base);

    const baseStr = await utils.get_objstr("assets/objs/3DConnect4base.obj");
    baseMesh = new OBJ.Mesh(baseStr);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baseMesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baseMesh.vertexNormals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalsLocation);
    gl.vertexAttribPointer(normalsLocation, 3, gl.FLOAT, false, 0, 0);

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

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coinMesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coinMesh.vertexNormals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalsLocation);
    gl.vertexAttribPointer(normalsLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coinMesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coinMesh.indices), gl.STATIC_DRAW);

    ////////// LOAD TABLE

    var table = gl.createVertexArray();
    gl.bindVertexArray(table);

    const tableStr = await utils.get_objstr("assets/objs/3DConnect4table.obj");
    tableMesh = new OBJ.Mesh(tableStr);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tableMesh.vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tableMesh.vertexNormals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalsLocation);
    gl.vertexAttribPointer(normalsLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tableMesh.textures), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tableMesh.indices), gl.STATIC_DRAW);

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
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, textures[3]);

        //////////// LIGHTS ///////////////

        var dirLightTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(utils.invertMatrix(utils.transposeMatrix(viewMatrix))), directionalLight)
        gl.uniform3fv(dirLightDirectionHandle, dirLightTransformed)
        gl.uniform3fv(dirLightColorHandle, directionalLightColor)

        gl.uniform3fv(ambLightCoeffHandle, ambientLight)
        gl.uniform3fv(ambLightColorHandle, ambientLightColor)

        gl.uniform3fv(mSpecColorHandle, specularColor)
        gl.uniform1f(mSpecPowerHandle, specularPower)

        let spot1Dir1 = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(utils.invertMatrix(utils.transposeMatrix(viewMatrix))), spot1Dir)
        let spot1Pos2 = utils.multiplyMatrix3Vector3(viewMatrix, spot1Pos);
        gl.uniform3fv(spot1DirectionHandle, spot1Dir1)
        gl.uniform3fv(spot1PositionHandle, spot1Pos2)
        gl.uniform3fv(spot1LightColorHandle, spot1Color)

        let spot2Dir2 = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(utils.invertMatrix(utils.transposeMatrix(viewMatrix))), spot2Dir)
        let spot2Pos2 = utils.multiplyMatrix3Vector3(viewMatrix, spot2Pos);
        gl.uniform3fv(spot2DirectionHandle, spot2Dir2)
        gl.uniform3fv(spot2PositionHandle, spot2Pos2)
        gl.uniform3fv(spot2LightColorHandle, spot2Color)

        gl.uniform1f(spotTargetHandle, spotLightTarget)
        gl.uniform1f(spotDecayHandle, spotLightDecay)
        gl.uniform1f(innerConeHandle, innerCone)
        gl.uniform1f(outerConeHandle, outerCone)

        //////////// BASE /////////////////
        var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, baseWorldMatrix);
        var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

        let baseNormalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
        gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(baseNormalMatrix));
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

        gl.uniform1i(textLocation, 0);

        gl.bindVertexArray(base);
        gl.drawElements(gl.TRIANGLES, baseMesh.indices.length, gl.UNSIGNED_SHORT, 0);

        ///////////// TABLE
        var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, tableWorldMatrix);
        var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

        let tableNormalMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
        gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(tableNormalMatrix));
        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

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
            (i%2 === 0) ? gl.uniform1i(textLocation, 1) : gl.uniform1i(textLocation, 2)

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
    var path = window.location.pathname;
    var page = path.split("/").pop();
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
        coinPosition[i] = [-10 + (i / 26), -(baseHeight + 0.08) * 10, 7.00 - (0.50 * (i % 26.0))]


    for (let i=1; i<COINS; i += 2)
        coinPosition[i] = [10 - (i / 26), -(baseHeight + 0.08) * 10, 7.00 - (0.50 * (i % 26.0))]

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


