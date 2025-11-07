// --- Game Initialization ---
// This function sets up the entire chess board and its initial state.
async function createBoard() {
  try {
    // Get board data from the server
    const responseInfo = await getBoard();
    const board = responseInfo.board;
    window.turn = responseInfo.turn;

    // Update turn display
    // Update turn display
    const turns = document.getElementById('turns');
      if (window.turn) {
          turns.innerText = "⚪";
      } else {
          turns.innerHTML = "⚫";
      }


    // Check for AI and get its move if it's the AI's turn
    const aiCol = document.getElementById("aiCol").innerText;
    if (aiCol !== "None") {
      getAiMove(aiCol);
    }

    window.boardVar = board;

    // Loop through the board to draw squares and pieces
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let sqColor;
        let uiNum;
        let uiLet;

        // Determine square color
        if ((i + j) % 2 === 0) {
          sqColor = "light";
        } else {
          sqColor = "dark";
        }

        const piece = board[i][j];
        const cords = `${i}${j}`;

        // Add UI coordinates (numbers and letters)
        if (j === 0) {
          uiNum = 8 - i;
        }
        if (i === 7) {
          uiLet = String.fromCharCode(97 + j);
        }

        drawSquares(sqColor, piece, cords, uiNum, uiLet);
      }
    }
  } catch (error) {
    console.error("Failed to create board:", error);
  }
}

// Immediately call the function to set up the game
createBoard();

// --- AJAX Communication Functions ---
// Sends a GET request to the server to get the current board state.
async function getBoard() {
  return new Promise((resolve, reject) => {
    $.get("/board/")
      .done((data) => resolve(data))
      .fail((error) => reject(error));
  });
}

// Sends a POST request to get legal moves for a piece.
function getMoves(sqId) {
  const formdata = new FormData();
  const csrf = document.getElementsByName("csrfmiddlewaretoken");
  formdata.append("csrfmiddlewaretoken", csrf[0].value);
  formdata.append("sqId", sqId);

  $.ajax({
    type: "POST",
    url: "/board/",
    enctype: "multipart/form-data",
    data: formdata,
    success: function (res) {
      if (res.checkMate) {
        checkMateHandler("c");
      }
      if (res.draw) {
        checkMateHandler("d");
      }
      highlightAvailableMoves(res.moves);
      drawcaptureStatus(res.captureStatus);
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

// Sends a POST request to get a move from the AI.
function getAiMove(aiCol) {
  const formdata = new FormData();
  const csrf = document.getElementsByName("csrfmiddlewaretoken");
  formdata.append("csrfmiddlewaretoken", csrf[0].value);
  formdata.append("aiCol", aiCol);
  $.ajax({
    type: "POST",
    url: "/board/",
    enctype: "multipart/form-data",
    data: formdata,
    success: function (res) {
      removeLastMoveHighlight();
      window.turn = res.turn;
      compareBoard(res.board);
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

// Sends the new piece placement to the server.
function sendNewPlace(oldID, newID) {
  const aiCol = document.getElementById("aiCol").innerText;
  const formdata = new FormData();
  const csrf = document.getElementsByName("csrfmiddlewaretoken");
  formdata.append("csrfmiddlewaretoken", csrf[0].value);
  formdata.append("newSqId", newID);
  formdata.append("oldSqId", oldID);

  $.ajax({
    type: "POST",
    url: "/board/",
    enctype: "multipart/form-data",
    data: formdata,
    success: function (res) {
      removeLastMoveHighlight();
      window.turn = res.turn;
      compareBoard(res.board);
      if (aiCol !== "None") {
        getAiMove(aiCol);
      }
    },
    cache: false,
    contentType: false,
    processData: false,
  });
}

// --- Drawing and Board State Functions ---
// Draws a single square on the board.
function drawSquares(sqColor, piece, cords, uiNum, uiLet) {
  const board = document.getElementById("board");
  const square = document.createElement("div");
  square.classList.add("square", sqColor);
  square.id = cords;
  board.appendChild(square);

  const squarePieceName = document.createElement("p");
  squarePieceName.innerText = piece;
  square.appendChild(squarePieceName);

  // Draw the piece image if it exists
  const pieceImageUrl = drawImages(piece);
  if (pieceImageUrl) {
    const img = document.createElement("img");
    img.src = pieceImageUrl;
    square.appendChild(img);
  }

  // Draw the board coordinates
  if (uiNum) {
    const cordNumber = document.createElement("span");
    cordNumber.classList.add("uiNum");
    cordNumber.innerText = uiNum;
    square.appendChild(cordNumber);
  }
  if (uiLet) {
    const cordLetter = document.createElement("span");
    cordLetter.classList.add("uiLet");
    cordLetter.innerText = uiLet;
    square.appendChild(cordLetter);
  }

  // Handle click events
  square.addEventListener("click", function () {
    const selected = document.querySelectorAll(".selected");
    const highlighted = document.querySelectorAll(".highlightAvailable");
    pieceClickHandler(this, selected, highlighted);
  });
}

// Handles user clicks on a square.
function pieceClickHandler(selectedPiece, selected, highlighted) {
  const turn = window.turn;

  // If the user clicks a highlighted square, make a move
  if (selectedPiece.classList.contains("highlightAvailable")) {
    sendNewPlace(selected[0].id, selectedPiece.id);
  }

  // Remove any existing highlights
  removeHighlights(selected, highlighted);

  // If the piece belongs to the current player's turn, select it
  if (upInverse(turn, selectedPiece.innerText)) {
    selectedPiece.classList.add("selected");
    getMoves(selectedPiece.id);
  }
}

// Highlights available moves on the board.
function highlightAvailableMoves(moves) {
  for (const move of moves) {
    const square = document.getElementById(move);
    if (square) {
      square.classList.add("highlightAvailable");
    }
  }
}

// Compares the new board state to the old one and updates the UI.
function compareBoard(newBoard) {
  const oldBoard = window.boardVar;
  const changesArr = [];

  // Find all differences between the two boards
  for (let i = 0; i < newBoard.length; i++) {
    for (let j = 0; j < newBoard[i].length; j++) {
      if (newBoard[i][j] !== oldBoard[i][j]) {
        changesArr.push({
          o: oldBoard[i][j],
          n: newBoard[i][j],
          c: `${i}${j}`,
        });
      }
    }
  }

  lastMoveHighlight(changesArr);
  movePieces(changesArr, newBoard);
}

// Updates the visual position of pieces based on the differences found.
function movePieces(differences, newBoard) {
  for (const diff of differences) {
    const square = document.getElementById(diff.c);
    const squareText = square.querySelector("p");
    const squareImage = square.querySelector("img");

    // Update the piece's image and text
    if (diff.n !== "") {
      const squareNewImage = document.createElement("img");
      squareNewImage.src = drawImages(diff.n);
      square.appendChild(squareNewImage);

      if (squareImage) {
        square.removeChild(squareImage);
      }
      squareText.innerText = diff.n;
    } else {
      // Remove the piece if the new square is empty
      if (squareImage) {
        square.removeChild(squareImage);
      }
      squareText.innerText = "";
    }
  }

  window.boardVar = newBoard;

  // Update turn display after the move
  const turns = document.getElementById("turns");
  if (window.turn) {
    turns.innerText = "White's Turn ⚪";
  } else {
    turns.innerHTML = "Black's Turn ⚫";
  }
}

// --- Helper Functions ---
// Helper to check if a string is uppercase
function isUpperCase(string) {
  return /^[A-Z]*$/.test(string);
}

// Creates the URL for a piece's image.
function drawImages(piece) {
  if (!piece) return null;

  let color;
  if (isUpperCase(piece)) {
    color = "white";
  } else {
    color = "black";
  }

  let pieceName = "";
  switch (piece.toLowerCase()) {
    case "p":
      pieceName = "pawn";
      break;
    case "r":
      pieceName = "rook";
      break;
    case "n":
      pieceName = "knight";
      break;
    case "b":
      pieceName = "bishop";
      break;
    case "q":
      pieceName = "queen";
      break;
    case "k":
      pieceName = "king";
      break;
    default:
      pieceName = piece.toLowerCase();
  }
  const imageUrl = STATIC_URL + `${color}-${pieceName}.png`;
  return imageUrl;
}

// Removes selection and highlighting from the board.
function removeHighlights(selected, highlighted) {
  selected.forEach((sq) => sq.classList.remove("selected"));
  highlighted.forEach((sq) => sq.classList.remove("highlightAvailable"));
}

// Highlights the squares involved in the last move.
function lastMoveHighlight(changesArr) {
  changesArr.forEach((change) => {
    const square = document.getElementById(change.c);
    if (square) {
      square.classList.add("recentlyMoved");
    }
  });
}

// Removes the last move highlight.
function removeLastMoveHighlight() {
  const lastMoves = document.querySelectorAll(".recentlyMoved");
  lastMoves.forEach((sq) => sq.classList.remove("recentlyMoved"));
}

// Checks if a piece belongs to the current player.
function upInverse(switcher, string) {
  const isUpperCase = (str) => /^[A-Z]*$/.test(str);
  if (!string) return false;
  if (switcher) {
    return isUpperCase(string[0]);
  } else {
    return !isUpperCase(string[0]);
  }
}

// Handles checkmate or draw conditions.
function checkMateHandler(checker) {
  togglePopup();
  let win = "";
  if (checker === "c") {
    if (window.turn) {
      win = "Black won by checkmate";
    } else {
      win = "White won by checkmate";
    }
  } else if (checker === "d") {
    win = "Draw";
  }
  document.getElementById("winner").innerText = win;
}

// Draws the captured pieces.
function drawcaptureStatus(captureStatus) {
  const darkStatus = document.getElementById("darkStatus");
  const lightStatus = document.getElementById("lightStatus");

  darkStatus.innerHTML = "<h2>Captured Pieces:</h2>";
  lightStatus.innerHTML = "<h2>Captured Pieces:</h2>";

  captureStatus[0].forEach((piece) => {
    const image = document.createElement("img");
    image.classList.add("captured-piece");
    image.src = drawImages(piece);
    darkStatus.appendChild(image);
  });

  captureStatus[1].forEach((piece) => {
    const image = document.createElement("img");
    image.classList.add("captured-piece");
    image.src = drawImages(piece);
    lightStatus.appendChild(image);
  });
}

// Toggles the game end popup.
function togglePopup() {
  const popup = document.getElementById("popup-1");
  if (popup) {
    popup.classList.toggle("active");
  }
}
