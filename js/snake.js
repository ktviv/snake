
const REQUEST_ANIMATION_FRAME = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
const CANVAS = document.getElementById('snake_canvas');
const CONTEXT = CANVAS.getContext('2d');
const BLOCK_SIZE = 20;
const CANVAS_SCALE_FACTOR = 30;
const PLAY_FIELD_SCALE_FACTOR = (2 * CANVAS_SCALE_FACTOR) / 3;
CANVAS.width  = BLOCK_SIZE * CANVAS_SCALE_FACTOR;
CANVAS.height = BLOCK_SIZE * CANVAS_SCALE_FACTOR;
const FPS = 60;
const INTERVAL = 1000 / FPS;
const BORDER_WIDTH = BLOCK_SIZE * 4;
const PLAY_AREA_WIDTH = PLAY_FIELD_SCALE_FACTOR * BLOCK_SIZE;
const PLAY_AREA_HEIGHT = PLAY_FIELD_SCALE_FACTOR * BLOCK_SIZE;
const SPRITE_BRICK = document.getElementById("sprite_brick");
const SPRITE_BLOCK = document.getElementById("sprite_block");
const SPRITE_FOOD = document.getElementById("sprite_food");


const SNAKE = [];
const FIELD = [];
const DEAD_AUD = new Audio();
const EAT_AUD = new Audio();
const UP_AUD = new Audio();
const RIGHT_AUD = new Audio();
const LEFT_AUD = new Audio();
const DOWN_AUD = new Audio();
DEAD_AUD.src = "../audio/dead.mp3";
EAT_AUD.src = "../audio/eat.mp3";
UP_AUD.src = "../audio/up.mp3";
RIGHT_AUD.src = "../audio/right.mp3";
LEFT_AUD.src = "../audio/left.mp3";
DOWN_AUD.src = "../audio/down.mp3";

class Utils {

    static translateXY(xPos, yPos) {

        return Utils.translate(yPos, xPos, PLAY_FIELD_SCALE_FACTOR);
    }

    // translate 2d array indices to 1d array index
    static translate(row, column, rowSize) {

        return (row * rowSize) + column;
    }

    static randInt(min, max, positive) {

        let num;
        if (positive === false) {

            num = Math.floor(Math.random() * max) - min;
            num *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
        } else {

            num = Math.floor(Math.random() * max) + min;
        }
        return num;
    }

    static nextTetrominoIndex() {

        return Utils.randInt(0, TETROMINOS.length, true);
    }
}

class snakeBod {

    constructor(xPos, yPos) {

        this.xPos = xPos;
        this.yPos = yPos;
    }

    draw() {

        CONTEXT.drawImage(SPRITE_BLOCK, this.xPos, this.yPos, BLOCK_SIZE, BLOCK_SIZE);
    }

    clear() {

        CONTEXT.clearRect(this.xPos, this.yPos, BLOCK_SIZE, BLOCK_SIZE);
    }
}

class snakeFood {

    constructor(xPos, yPos) {

        this.xPos = xPos;
        this.yPos = yPos;
    }

    draw() {

        CONTEXT.drawImage(SPRITE_FOOD, this.xPos, this.yPos, BLOCK_SIZE, BLOCK_SIZE);
    }

    clear() {

        CONTEXT.clearRect(this.xPos, this.yPos, BLOCK_SIZE, BLOCK_SIZE);
    }

    reset() {

    }
}

class PlayField {

    constructor(scaleFactor, widthPx, heightPx) {

        this.scaleFactor = scaleFactor;
        this.widthPx = widthPx;
        this.heightPx = heightPx;
        this.playAreaArray = [];
        this.initialize();
    }

    initialize() {

        for (let i = 0; i < this.scaleFactor; i ++) {

            for (let j = 0;j < this.scaleFactor; j ++) {

                this.playAreaArray[Utils.translateXY(j, i)] = 0;
            }
        }
    }

    draw() {

        for (let i = 0;i < this.playAreaArray.length; i++) {

            if (this.playAreaArray[i] == 1) {

                var x = (i % (this.heightPx / this.scaleFactor));
                var y = (Math.floor(i / (this.widthPx / this.scaleFactor)));
                var newXPos = BORDER_WIDTH + BLOCK_SIZE + (x * BLOCK_SIZE);
                var newYPos = BORDER_WIDTH + BLOCK_SIZE + (y * BLOCK_SIZE);
                CONTEXT.drawImage(SPRITE_BLOCK, newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    clear(includeValues) {

        for (let i = 0;i < this.playAreaArray.length; i++) {

            if (this.playAreaArray[i] == 1) {

                if (includeValues) {

                    this.playAreaArray[i] = 0;
                }
                var x = (i % (this.heightPx / this.scaleFactor));
                var y = (Math.floor(i / (this.widthPx / this.scaleFactor)));
                var newXPos = BORDER_WIDTH + BLOCK_SIZE + (x * BLOCK_SIZE);
                var newYPos = BORDER_WIDTH + BLOCK_SIZE + (y * BLOCK_SIZE);
                CONTEXT.clearRect(newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    drawScore(score) {

        CONTEXT.clearRect(BORDER_WIDTH + 3 * BLOCK_SIZE, BLOCK_SIZE, 2 * BLOCK_SIZE, BLOCK_SIZE);
        CONTEXT.fillText("SCORE : " + score, BORDER_WIDTH, 2 * BLOCK_SIZE);
    }

    drawLevel() {

        CONTEXT.clearRect(CANVAS.width - BORDER_WIDTH - BLOCK_SIZE, BLOCK_SIZE, 2 * BLOCK_SIZE, BLOCK_SIZE);
        CONTEXT.fillText("LEVEL : " + speedCounter, CANVAS.width - BORDER_WIDTH - 4 * BLOCK_SIZE, 2 * BLOCK_SIZE);
    }
}


var initialized = false;
var gameOver = false;
var paused = false;
var speed = 60;
var speedCounter = 1;
var score = 0;
var food = null;
var playField = null;
let now, delta;
let then = Date.now();
let sNow, sDelta;
let sThen = Date.now();
let currentDirection = "RIGHT";


function draw() {

    if (!initialized) {

        initialize();
        initialized = true;
    }

    if (!gameOver && initialized) {

        animation = REQUEST_ANIMATION_FRAME(draw);
        now   = Date.now();
        delta = now - then;
        if (delta > INTERVAL) {

            then = now - (delta % INTERVAL);
            runGame();
        }
    }
}

draw();


function gameOverScreen() {

    var count = 0;

    var intervalId = setInterval(function() {

        if (count < playField.playAreaArray.length) {

            var x = (count % (playField.heightPx / playField.scaleFactor));
            var y = (Math.floor(count / (playField.widthPx / playField.scaleFactor)));
            var newXPos = BORDER_WIDTH + BLOCK_SIZE + (x * BLOCK_SIZE);
            var newYPos = BORDER_WIDTH + BLOCK_SIZE + (y * BLOCK_SIZE);
            CONTEXT.drawImage(SPRITE_BLOCK, newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            count++;
        } else {

            clearInterval(intervalId);
            CONTEXT.clearRect(BORDER_WIDTH + BLOCK_SIZE, BORDER_WIDTH + BLOCK_SIZE, 20 * BLOCK_SIZE, 20 * BLOCK_SIZE);

            CONTEXT.font = "30px Consolas";
            var gradient = CONTEXT.createLinearGradient(0, 0, 6*BLOCK_SIZE, 0);
            gradient.addColorStop("0", "black");
            gradient.addColorStop("0.5", "blue");
            gradient.addColorStop("1.0", "magenta");

            CONTEXT.fillStyle = gradient;
            CONTEXT.textAlign = "center";
            CONTEXT.fillText("GAME OVER", CANVAS.width / 2, CANVAS.height / 2);
            setTimeout(function() {

                reset();
            }, 3000);
        }
    }, 5);
}

function reset() {

    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
    initialized = false;
    paused = false;
    speed = 60;
    speedCounter = 1;
    score = 0;
    then = Date.now();
    sThen = Date.now();
    gameOver = false;
    draw();
}

function initialize() {

    drawBoundary();
    initializePlayField();
    initializeSnake();
    initializeFood();
}

function drawBoundary() {

    var _drawBlock = function(xPos, yPos, width, height) {

        CONTEXT.drawImage(SPRITE_BRICK, xPos, yPos, width, height);
    }
    var bricks = 0;
    var xPos = 0;
    var yPos = 0;
    bricks = (PLAY_AREA_WIDTH / BLOCK_SIZE) + 2;
    for (let i = 0;i < bricks;i ++) {
        //draw horizontal borders
        if (i < bricks) {

            xPos = BORDER_WIDTH + (i * BLOCK_SIZE);
            _drawBlock(xPos, BORDER_WIDTH, BLOCK_SIZE, BLOCK_SIZE);

           yPos = CANVAS.height - BORDER_WIDTH - BLOCK_SIZE;
           _drawBlock(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        }
        //draw vertical borders
        if (i > 0 && i <= (bricks - 2)) {

           yPos = BORDER_WIDTH + (i * BLOCK_SIZE);
           _drawBlock(BORDER_WIDTH, yPos, BLOCK_SIZE, BLOCK_SIZE);

           xPos = CANVAS.width - BORDER_WIDTH - BLOCK_SIZE;
           _drawBlock(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
}

function initializeSnake() {

    var startX = (BORDER_WIDTH + BLOCK_SIZE + (PLAY_AREA_WIDTH / 2)) - (2 * BLOCK_SIZE);
    var startY = (BORDER_WIDTH + BLOCK_SIZE + (PLAY_AREA_HEIGHT / 2)) - (2 * BLOCK_SIZE)
    SNAKE[0] = new snakeBod(startX, startY);
}

function initializeFood() {

    food = new snakeFood(2*BORDER_WIDTH, 2*BORDER_WIDTH);
}

function initializePlayField() {

    playField = new PlayField(PLAY_FIELD_SCALE_FACTOR, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

    CONTEXT.font = "15px Consolas";
    var gradient = CONTEXT.createLinearGradient(0, 0, PLAY_AREA_WIDTH, 0);
    gradient.addColorStop("0", "black");
    gradient.addColorStop("0.5", "blue");
    gradient.addColorStop("1.0", "magenta");

    CONTEXT.fillStyle = gradient;
    CONTEXT.textAlign = "start";
    CONTEXT.fillText("SCORE : " + score, BORDER_WIDTH, 2 * BLOCK_SIZE);
    CONTEXT.fillText("LEVEL : " + speedCounter, CANVAS.width - BORDER_WIDTH - 4 * BLOCK_SIZE, 2 * BLOCK_SIZE);
}


//control the snake


document.addEventListener("keydown", direction);

function direction(event) {

    let key = event.keyCode;
    if ( key == 37 && currentDirection != "RIGHT") {

        LEFT_AUD.play();
        currentDirection = "LEFT";
    } else if (key == 38 && currentDirection != "DOWN") {

        currentDirection = "UP";
        UP_AUD.play();
    } else if (key == 39 && currentDirection != "LEFT") {

        currentDirection = "RIGHT";
        RIGHT_AUD.play();
    } else if (key == 40 && currentDirection != "UP") {

        currentDirection = "DOWN";
        DOWN_AUD.play();
    }
}

// check collision function
function collision(head) {

    for(let i = 0; i < SNAKE.length; i++) {

        if(head.xPos == SNAKE[i].xPos && head.yPos == SNAKE[i].yPos) {

            return true;
        }
    }
    return false;
}

function runGame() { // this function will be called at the speed of FPS

    sNow   = Date.now();
    sDelta = sNow - sThen;
    if ((sDelta > INTERVAL * speed / speedCounter) && !paused) {

        sThen = sNow - (sDelta % (INTERVAL * speed / speedCounter));
        gameSpeedTick();
    }
}

function gameSpeedTick() {
    
    for( let i = 0; i < SNAKE.length ; i++) {

        SNAKE[i].draw();
    }

    food.draw();
    
    // old head position
    let snakeX = SNAKE[0].xPos;
    let snakeY = SNAKE[0].yPos;
    
    // which direction
    if( currentDirection == "LEFT") snakeX -= BLOCK_SIZE;
    if( currentDirection == "UP") snakeY -= BLOCK_SIZE;
    if( currentDirection == "RIGHT") snakeX += BLOCK_SIZE;
    if( currentDirection == "DOWN") snakeY += BLOCK_SIZE;
    
    // if the snake eats the food
    if(snakeX == food.xPos && snakeY == food.yPos) {

        score++;
        EAT_AUD.play();
        food.reset();
        // we don't remove the tail
    } else {
        // remove the tail
        var end = SNAKE.pop();
        end.clear();
    }
    
    // add new Head
    let head = new snakeBod(snakeX, snakeY);
    head.draw();

    // game over
    
    if(snakeX < (BORDER_WIDTH + (2 * BLOCK_SIZE)) ||
        snakeX > (CANVAS.width - BORDER_WIDTH - (3 * BLOCK_SIZE)) ||
        snakeY < (BORDER_WIDTH + (2 * BLOCK_SIZE)) ||
        snakeY > (CANVAS.height - BORDER_WIDTH - (3 * BLOCK_SIZE)) ||
        collision(head)) {

        DEAD_AUD.play();
        gameOver = true;
        gameOverScreen();
    }
    
    SNAKE.unshift(head);
}
