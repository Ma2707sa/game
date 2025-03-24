//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let paused = false;
let score = 0;
let highestScore = localStorage.getItem("flappyHighest") || 0;
let countdownRunning = false; // Flag to track if countdown is running

// Load sounds
const jumpSound = new Audio("tone/sfx_wing.wav");
const hitSound = new Audio("tone/sfx_hit.wav");
const pointSound = new Audio("tone/sfx_point.wav");
const swooshSound = new Audio("tone/sfx_swooshing.wav");
const dieSound = new Audio("tone/sfx_die.wav");
const toneSound = new Audio("tone/sfx_tone.wav"); // Define toneSound
const bgm = new Audio("tone/bgm_mario.mp3");
bgm.loop = true;
let soundEnabled = true;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    birdImg = new Image();
    birdImg.src = "imgs/flappybird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImg = new Image();
    topPipeImg.src = "imgs/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "imgs/bottompipe.png";

    changeWallpaper(); // Change wallpaper based on time of day
    setInterval(changeWallpaper, 10000); // Change wallpaper every 10 seconds
    showStartScreen();
    document.addEventListener("keydown", handleKeyDown);

    // Add event listeners for the buttons
    document.getElementById("toggleButton").addEventListener("click", toggleGame);
    document.getElementById("startButton").addEventListener("click", startGame);
    document.getElementById("replayButton").addEventListener("click", restartGame);
    document.getElementById("modalReplayButton").addEventListener("click", restartGame);
    document.getElementById("modalStartButton").addEventListener("click", startGame); // Updated event listener for modal start button

    // Get the modal
    var modal = document.getElementById("gameOverModal");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none"; // Only close the modal
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none"; // Only close the modal
        }
    }

    // Add touch event listeners for mobile support
    board.addEventListener("touchstart", handleTouch);
    board.addEventListener("touchend", handleTouch);
};

function changeWallpaper() {
    const seconds = new Date().getSeconds();
    let backgroundImage;

    if (seconds >= 0 && seconds < 10) {
        backgroundImage = "imgs/flappybirdbg.png"; // Morning wallpaper
    } else if (seconds >= 10 && seconds < 20) {
        backgroundImage = "imgs/back-11.png"; // Afternoon wallpaper
    } else {
        backgroundImage = "imgs/back.png"; // Evening wallpaper
    }
    document.getElementById("board").style.backgroundImage = `url(${backgroundImage})`;
}

setInterval(changeWallpaper, 10000); // Change wallpaper every 10 seconds

function update() {
    if (gameOver || paused) return;
    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        endGame();
    }

    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
            if (soundEnabled) pointSound.play();
        }

        if (detectCollision(bird, pipe)) {
            endGame();
        }
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);
    context.fillText("High Score: " + highestScore, 5, 90);
}

function placePipes() {
    if (gameOver || paused) return;
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if ((e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") && !gameOver && !paused) {
        velocityY = -6;
        if (soundEnabled) jumpSound.play();
    }
    if (gameOver && e.code === "Enter") {
        restartGame();
    }
}

function playToneSound(e) {
    if (e.code === "KeyT" && soundEnabled) { // Play tone sound when 'T' key is pressed
        toneSound.play();
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function endGame() {
    if (soundEnabled) hitSound.play();
    gameOver = true;
    if (score > highestScore) {
        highestScore = score;
        localStorage.setItem("flappyHighest", highestScore);
    }
    showGameOver();
}

function showGameOver() {
    var modal = document.getElementById("gameOverModal");
    modal.style.display = "block";
}

function restartGame() {
    bird.y = birdY;
    velocityY = 0;
    score = 0;
    pipeArray = [];
    gameOver = false;
    document.getElementById("replayButton").style.display = "none";
    document.getElementById("gameOverModal").style.display = "none";
    update();
}

function handleKeyDown(e) {
    if (e.code === "KeyP") {
        paused = !paused;
        if (!paused) update();
    } else if (e.code === "KeyM") {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            bgm.play();
        } else {
            bgm.pause();
        }
    } else {
        moveBird(e);
        playToneSound(e);
    }
}

function showStartScreen() {
    var startScreenModal = document.getElementById("startScreenModal");
    startScreenModal.style.display = "block";
}

function startGame() {
    document.getElementById("startScreenModal").style.display = "none";
    document.getElementById("startButton").style.display = "none";
    document.getElementById("replayButton").style.display = "none";
    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
    bgm.play();
}

function toggleGame() {
    paused = !paused;
    document.getElementById("toggleButton").textContent = paused ? "Play" : "Pause";
    if (!paused) update();
}

function handleTouch(e) {
    if (!gameOver && !paused) {
        velocityY = -6;
        if (soundEnabled) jumpSound.play();
    }
    if (gameOver) {
        restartGame();
    }
}

