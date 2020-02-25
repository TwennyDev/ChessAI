const BOARD_SIZE = 1000;
const CELLS = 8;
const CELL_SIZE = BOARD_SIZE / CELLS;
const MAX_DEPTH = 3;

const notation = {

    kc: 'O-O',
    qc: 'O-O-O',
    King: 'K',
    Queen: 'Q',
    Pawn: '',
    Bishop: 'B',
    Knight: 'N',
    Rook: 'R'

}

var move_history;

//Arrays
var playerPieces;
var aiPieces;
var board;

//Game stuff
var playerColor;
var move_no;

//Board canvas
var canvas;
var ctx;

//Piece canvas
var canvas2;
var ctx2;

//Mousedrag canvas
var canvas3;
var ctx3;

//Piece sprite sheet
var image;

//Player turn boolean
var playerTurn;

//Mouse drag stuff
var mousedown = false;
var dragPiece = null;

//Opening
var opening;
var openingMoves;
var move_n;
var opening_move;

//Kings
var _pking;
var _cking;

//Stats
var nodes;
var leaves;

window.onload = function () {

    initCanvas();

    //Listener to select a piece
    canvas3.addEventListener('mousedown', function (event) {

        if (playerTurn && !mousedown) {            
            
            let rect = canvas2.getBoundingClientRect();

            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

            //console.log(x + " " + y);

            let cell = getCellPos(x, y);
            let piece = getPiece(cell.x, cell.y);

            if (piece != null && piece.player == 'human') {

                //Drag piece
                mousedown = true;
                dragPiece = piece;
                clearCell(piece.x, piece.y);
                mouseDragPiece(x, y, dragPiece);
            }
        }

    });

    //Listener to drag a piece
    canvas3.addEventListener('mousemove', function (event) {

        if (playerTurn && mousedown && dragPiece != null) {

            let rect = canvas2.getBoundingClientRect();

            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

            //console.log(x + " " + y);
            
            ctx3.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
            mouseDragPiece(x, y, dragPiece);

        }

    });

    //Listener to place a piece
    document.addEventListener('mouseup', function (event) {

        if (playerTurn && mousedown) {
            mousedown = false;

            let rect = canvas2.getBoundingClientRect();

            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

            let cell = getCellPos(x, y);

            //If move is valid then move piece
            if (isMoveValid(dragPiece, cell.x, cell.y)) {

                //Check if piece is a pawn and set firstmove to false
                if (dragPiece instanceof Pawn || dragPiece instanceof Rook) {
                    if (dragPiece.firstMove) {
                        dragPiece.firstMove = false;
                    }
                }                

                //Check if user is moving a king
                if (dragPiece instanceof King) {

                    //Check if castling
                    let dx = Math.abs(cell.x - dragPiece.x);

                    if (dx > 1) {

                        let rook = castleRook(dragPiece, cell.x, cell.y);

                        //Check if castle move is invalid
                        if (rook == null || !rook.firstMove) {

                            ctx3.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

                            drawPiece(dragPiece);
                            dragPiece = null;

                            return;

                        }

                        dragPiece.hasCastled = true;

                        //Move rook to castle position
                        board[rook.y][rook.x] = null;
                        board[rook.y][rook.castlex] = rook;

                        clearCell(rook.x, rook.y);

                        rook.x = rook.castlex;
                        rook.firstMove = false;

                        drawPiece(rook);

                    }

                    //If this is the kings first move, set firstmove flag to false
                    if (dragPiece.firstMove) {
                        dragPiece.firstMove = false;
                    }

                }

                //Add move notation before updating piece
                addMoveNotation(dragPiece, cell.x, cell.y);

                //Move piece in board array
                board[dragPiece.y][dragPiece.x] = null;
                board[cell.y][cell.x] = dragPiece;

                //Clear original cell
                clearCell(cell.x, cell.y);                

                //Change piece's pos to new pos
                dragPiece.x = cell.x;
                dragPiece.y = cell.y;                

                //Initiate ai turn
                playerTurn = false;
                ctx3.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

                drawPiece(dragPiece);
                dragPiece = null;

                updateMoveList();

                if (playerColor == 'black') move_no++;

                updateScoreArea();

                setTimeout(function () {
                    nextMove();
                }, 50);
                

            } else {
                ctx3.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

                drawPiece(dragPiece);
                dragPiece = null;
            }

            
        }

    });

    initGame();

}

function initCanvas() { 

    let box = document.getElementById('game_box');
    box.style.width = BOARD_SIZE + 'px';
    box.style.margin = 'auto';

    image = document.getElementById("pieces");

    //Init canvas layer 1 for drawing board
    canvas = document.getElementById("canvas");
    canvas.width = BOARD_SIZE;
    canvas.height = BOARD_SIZE;

    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Init canas layer 2 for drawing chess pieces
    canvas2 = document.getElementById("canvas2");
    canvas2.width = BOARD_SIZE;
    canvas2.height = BOARD_SIZE;

    ctx2 = canvas2.getContext("2d");
    ctx2.clearRect(0, 0, canvas.width, canvas.height);

    //Init canvas layer 3 for drawing the piece being dragged
    canvas3 = document.getElementById("canvas3");
    canvas3.width = BOARD_SIZE;
    canvas3.height = BOARD_SIZE;

    ctx3 = canvas3.getContext("2d");
    ctx3.clearRect(0, 0, canvas.width, canvas.height);

    //Draw box around board
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.stroke();

    //Draw cell grid
    for (let i = 1; i < CELLS; i++) {

        //Vertical
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();

        //Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();

    }

    //Fill cells
    for (let y = 0; y < CELLS; y++) {

        for (let x = 0; x < CELLS; x++) {

            fillCell(x, y);

        }

    }

    initScoreBoard();

}

function initScoreBoard() {

    let sidebar = document.getElementById('score_board');
    sidebar.style.height = BOARD_SIZE + 'px';    
    sidebar.style.left = (BOARD_SIZE + 20) + 'px';

}

function updateScoreArea() {

    let span = document.getElementById('score_span');
    let score = getTotalScore() / 100;

    span.innerHTML = (score > 0) ? '+' + score.toFixed(2) : score.toFixed(2);

}

function updateMoveList() {

    let moveList = document.getElementById('move_list');
    let current_move = move_history[move_no - 1].split(' ');

    let cont = document.getElementById('move' + move_no);

    if (cont == null) {
        cont = document.createElement('div');
        cont.className = 'move_box';
        cont.id = 'move' + move_no;
        if (move_no % 2 != 0) cont.style.background = '#F5F5F5';
        else cont.style.background = '#d3d3d3';
    }
    else cont.innerHTML = '';
    
    let num_div = document.createElement('div');
    let white_div = document.createElement('div');
    let black_div = document.createElement('div');
    
    num_div.className = 'move_num';
    white_div.className = 'move_white';
    black_div.className = 'move_black';

    num_div.innerHTML = current_move[0];
    white_div.innerHTML = current_move[1];
    black_div.innerHTML = current_move[2];

    cont.appendChild(num_div);
    cont.appendChild(white_div);
    cont.appendChild(black_div);

    moveList.appendChild(cont);

}

function initGame() {

    move_history = [];
    move_no = 1;
    playerPieces = [];
    aiPieces = [];
    board = new Array(8);

    for (let i = 0; i < 8; i++) {

        board[i] = new Array(8);

        for (let j = 0; j < 8; j++) {

            board[i][j] = null;

        }

    }

    let colors = ['white', 'black'];
    let aiColor;

    playerColor = colors.splice(Math.floor(Math.random() * 2), 1)[0];
    aiColor = colors[0];

    //Player pieces
    //Rooks
    let p_rook1 = new Rook(0, 7, playerColor, image, 'human');
    let p_rook2 = new Rook(7, 7, playerColor, image, 'human');
    playerPieces.push(p_rook1);
    playerPieces.push(p_rook2);

    let a_rook1 = new Rook(0, 0, aiColor, image, 'ai');
    let a_rook2 = new Rook(7, 0, aiColor, image, 'ai');
    aiPieces.push(a_rook1);
    aiPieces.push(a_rook2);

    //Knights
    let p_knight1 = new Knight(1, 7, playerColor, image, 'human');
    let p_knight2 = new Knight(6, 7, playerColor, image, 'human');
    playerPieces.push(p_knight1);
    playerPieces.push(p_knight2);

    let a_knight1 = new Knight(1, 0, aiColor, image, 'ai');
    let a_knight2 = new Knight(6, 0, aiColor, image, 'ai');
    aiPieces.push(a_knight1);
    aiPieces.push(a_knight2);

    //Bishops
    let p_bishop1 = new Bishop(2, 7, playerColor, image, 'human');
    let p_bishop2 = new Bishop(5, 7, playerColor, image, 'human');
    playerPieces.push(p_bishop1);
    playerPieces.push(p_bishop2);

    let a_bishop1 = new Bishop(2, 0, aiColor, image, 'ai');
    let a_bishop2 = new Bishop(5, 0, aiColor, image, 'ai');
    aiPieces.push(a_bishop1);
    aiPieces.push(a_bishop2);

    //King/Queen
    if (playerColor == 'white') {
        let p_king = new King(4, 7, playerColor, image, 'human');
        let p_queen = new Queen(3, 7, playerColor, image, 'human');
        playerPieces.push(p_king);
        playerPieces.push(p_queen);

        let a_king = new King(4, 0, aiColor, image, 'ai');
        let a_queen = new Queen(3, 0, aiColor, image, 'ai');
        aiPieces.push(a_king);
        aiPieces.push(a_queen);

        _pking = p_king;
        _cking = a_king;
    } else {
        let p_king = new King(3, 7, playerColor, image, 'human');
        let p_queen = new Queen(4, 7, playerColor, image, 'human');
        playerPieces.push(p_king);
        playerPieces.push(p_queen);

        let a_king = new King(3, 0, aiColor, image, 'ai');
        let a_queen = new Queen(4, 0, aiColor, image, 'ai');
        aiPieces.push(a_king);
        aiPieces.push(a_queen);

        _pking = p_king;
        _cking = a_king;
    }

    //Pawns
    for (let i = 0; i < 8; i++) {

        let p_pawn = new Pawn(i, 6, playerColor, image, 'human');
        playerPieces.push(p_pawn);

        let a_pawn = new Pawn(i, 1, aiColor, image, 'ai');
        aiPieces.push(a_pawn);

    }

    //Draw pieces and add to board array
    for (let i = 0; i < playerPieces.length; i++) {

        let p_piece = playerPieces[i];
        let a_piece = aiPieces[i];

        drawPiece(p_piece);
        drawPiece(a_piece);

        board[p_piece.y][p_piece.x] = p_piece;
        board[a_piece.y][a_piece.x] = a_piece;

    }

    playerTurn = (playerColor == 'white');

    drawCellNumbers();

    openingMoves = [
        //Ruy Lopez
        [{ piece: { x: 3, y: 1 }, move: { x: 3, y: 3 } }, { piece: { x: 1, y: 0 }, move: { x: 2, y: 2 } }, { piece: { x: 2, y: 0 }, move: { x: 6, y: 4 } }],
        //Giuoco piano
        [{ piece: { x: 3, y: 1 }, move: { x: 3, y: 3 } }, { piece: { x: 1, y: 0 }, move: { x: 2, y: 2 } }, { piece: { x: 2, y: 0 }, move: { x: 5, y: 3 } }],
        //Sicilian Defense
        [{ piece: { x: 3, y: 1 }, move: { x: 3, y: 3 } }, { piece: { x: 1, y: 0 }, move: { x: 2, y: 2 } }, { piece: { x: 4, y: 1 }, move: { x: 4, y: 3 } }]
    ];

    if (!playerTurn) {
        opening = true;
        move_n = 0;
        opening_move = openingMoves[Math.floor(Math.random() * openingMoves.length)];
        nextMove();
    }
    else {
        opening = false;
    }    

}

//Add move notation to history
function addMoveNotation(piece, mx, my) {

    let move = '';

    if (piece.color == 'white') move += move_no + ". ";

    //Castling move
    if (piece instanceof King && Math.abs(piece.x - mx) > 1) {

        if (playerColor == 'white') {

            if (piece.x - mx < 0) move += notation['kc'];
            else move += notation['qc'];

        } else {

            if (piece.x - mx < 0) move += notation['qc'];
            else move += notation['kc'];

        }

    }
    //Normal move
    else {

        //Add piece name abbreviation
        move += notation[piece.constructor.name];

        //Piece taken
        if (board[my][mx] != null) {
            move += 'x';
        }

        //Add destination cell notation
        move += getCellNotation(mx, my);

    }

    //Enemy king in check
    if (piece.player == 'human' && isInCheck(_cking)) move += '+';
    else if (piece.player == 'ai' && isInCheck(_pking)) move += '+';

    if (piece.color == 'white') {
        move += ' ';
        move_history.push(move);
    } else {
        move_history[move_no - 1] += move;
    }

}

//Return a string denoting the cell's coordinate in chess notation
function getCellNotation(x, y) {

    if (x < 0 || x >= 8 || y < 0 || y >= 8) return 'Error';

    let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    let move = '';

    if (playerColor == 'white') {

        move += letters[x];
        move += -(y - 7) + 1;

    } else {

        move += letters[-(x - 7)];
        move += y + 1;

    }

    return move;

}

//Function for drawing cell numbers and letters
function drawCellNumbers() {

    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px Arial';

    let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    if (playerColor == 'white') {

        //Draw cell numbers
        for (let y = 0; y < 8; y++) {

            ctx.fillText(-(y - 8), 0 * CELL_SIZE + 5, (y + 1) * CELL_SIZE - 5);

        }

        //Draw cell letters
        for (let x = 0; x < 8; x++) {

            ctx.fillText(letters[x], (x + 1) * CELL_SIZE - 20, 8 * CELL_SIZE - 5);

        }

    } else {

        //Draw cell numbers
        for (let y = 1; y <= 8; y++) {

            ctx.fillText(y, 0 * CELL_SIZE + 5, y * CELL_SIZE - 5);

        }

        //Draw cell letters
        for (let x = 0; x < 8; x++) {

            ctx.fillText(letters[-(x - 7)], (x + 1) * CELL_SIZE - 20, 8 * CELL_SIZE - 5);

        }

    }

}

//Function for returning the rook that the king is moving towards during a catling move. May return null.
function castleRook(king, mx, my) {

    let rook = null;

    if (king.player == 'human') {

        if (mx - king.x > 0) {
            rook = board[7][7];
        } else {
            rook = board[7][0];
        }

    } else {

        if (mx - king.x > 0) {
            rook = board[0][7];
        } else {
            rook = board[0][0];
        }

    }

    //Checks to see if the king is trying to move over pieces
    if (rook != null) {

        //King moving to the right
        if (mx - king.x > 0) {

            for (let x = king.x + 1; x < rook.x; x++) {

                //Piece found, return null
                if (board[king.y][x] != null) return null;

                //Check if king is attempting to move through check
                let king_x = king.x;
                let cell_content = board[king.y][x];

                board[king.y][king.x] = null;
                board[king.y][x] = king;
                king.x = x;

                let chk = isInCheck(king);

                //Revert
                king.x = king_x;
                board[king.y][x] = cell_content;
                board[king.y][king.x] = king;

                if (chk) return null;
            }

        }
        //King is moving to the left
        else {

            for (let x = king.x - 1; x > rook.x; x--) {

                //Piece found, return null
                if (board[king.y][x] != null) return null;

                //Check if king is attempting to move through check
                let king_x = king.x;
                let cell_content = board[king.y][x];

                board[king.y][king.x] = null;
                board[king.y][x] = king;
                king.x = x;

                let chk = isInCheck(king);

                //Revert
                king.x = king_x;
                board[king.y][x] = cell_content;
                board[king.y][king.x] = king;

                if (chk) return null;
            }

        }

    }

    return rook;

}

//Check to see if a chosen move is valid
function isMoveValid(piece, mx, my) {    

    //Get available moves from piece
    let moves = piece.getMoves();
    let inMoves = false;

    for (let key in moves) {

        for (let i = 0; i < moves[key].length && !inMoves; i++) {

            let move = moves[key][i];
            if (mx == move.x && my == move.y) {

                inMoves = true;

                //Special rules for pawns, i.e. taking diagonally
                if (piece instanceof Pawn) {

                    if ((key == 'up' || key == 'down') && board[my][mx] != null) return false;
                    if ((key == 'upLeft' || key == 'upRight' || key == 'downLeft' || key == 'downRight') &&
                        (board[my][mx] == null || board[my][mx].player == piece.player)) return false;

                }

            }

        }

        if (inMoves) break;        

    }

    //If not in list of moves return false
    if (!inMoves) {
        return false;
    }    

    //Check if piece is attemping to "jump over" a piece
    if (!(piece instanceof Knight)) {        

        //Piece pos
        let p_x = piece.x;
        let p_y = piece.y;

        //End pos
        let e_x = mx;
        let e_y = my;

        //console.log(p_x + " " + p_y);
        //console.log(e_x + " " + e_y);

        //Increment/Decrement piece
        if (p_x < e_x) p_x++;
        else if (p_x > e_x) p_x--;
        if (p_y < e_y) p_y++;
        else if (p_y > e_y) p_y--;

        //Step through pieces path and check for any other pieces
        while (p_x != e_x || p_y != e_y) {

            if (board[p_y][p_x] != null) return false;

            if (p_x < e_x) p_x++;
            else if (p_x > e_x) p_x--;
            if (p_y < e_y) p_y++;
            else if (p_y > e_y) p_y--;
        }   

    }

    //Check if moving piece will result in check
    //Temporarily move piece on board
    let piece_x = piece.x;
    let piece_y = piece.y;
    let cell_content = board[my][mx];

    piece.x = mx;
    piece.y = my;

    board[piece_y][piece_x] = null;
    board[my][mx] = piece;

    //Is king in check?
    let chk = isInCheck(_pking);

    //Revert
    board[piece_y][piece_x] = piece;
    board[my][mx] = cell_content;
    piece.x = piece_x;
    piece.y = piece_y;

    //King is in check if piece moved here
    if (chk) return false;

    //Check cell landed on to see if there is a piece there
    let cell = board[my][mx];

    //Cell is clear
    if (cell == null) {
        return true;
    }

    //Cell is occupied by the player already
    if (cell.player == piece.player) {
        return false;
    }    

    //Cell is occupied by the opponent
    return true;

}

function isAiMoveValid(piece, mx, my) {

    //Special rules for pawns, i.e. taking diagonally
    if (piece instanceof Pawn) {

        let dx = Math.abs(piece.x - mx);
        let dy = Math.abs(piece.y - my);

        //Diagonal
        if (dx > 0 && dy > 0) {
            if (board[my][mx] == null || board[my][mx].player == piece.player) {
                return false;
            }
        //Vertical
        } else {

            if (board[my][mx] != null) return false;

        }        

    }

    //Check if piece is attemping to "jump over" a piece
    if (!(piece instanceof Knight)) {

        //Piece pos
        let p_x = piece.x;
        let p_y = piece.y;

        //End pos
        let e_x = mx;
        let e_y = my;

        //console.log(p_x + " " + p_y);
        //console.log(e_x + " " + e_y);

        //Increment/Decrement piece
        if (p_x < e_x) p_x++;
        else if (p_x > e_x) p_x--;
        if (p_y < e_y) p_y++;
        else if (p_y > e_y) p_y--;

        //Step through pieces path and check for any other pieces
        while (p_x != e_x || p_y != e_y) {

            if (board[p_y][p_x] != null) return false;

            if (p_x < e_x) p_x++;
            else if (p_x > e_x) p_x--;
            if (p_y < e_y) p_y++;
            else if (p_y > e_y) p_y--;
        }

    }

    //Check cell landed on to see if there is a piece there
    let cell = board[my][mx];

    //Cell is clear
    if (cell == null) {
        return true;
    }

    //Cell is occupied by the player already
    if (cell.player == piece.player) {
        return false;
    }

    //Cell is occupied by the opponent
    return true;


}

//Draw a chess piece onto the board using canvas layer 2
function drawPiece(piece) {

    var c = getCellCoord(piece.x, piece.y);

    ctx2.drawImage(image, piece.imagex, piece.imagey, piece.imagew, piece.imageh, c.x, c.y, CELL_SIZE, CELL_SIZE);

}

//Draw a chess piece onto canvas layer 3 to simulate dragging with mouse
function mouseDragPiece(x, y, piece) {

    ctx3.drawImage(image, piece.imagex, piece.imagey, piece.imagew, piece.imageh, x - (CELL_SIZE / 2), y - (CELL_SIZE / 2), CELL_SIZE, CELL_SIZE);

}

//Get total score of all chess pieces on board   NOTE x = FILE, y = RANK, halfway = 3.5
function getTotalScore() {

    let ai = 0;
    let human = 0;

    //Calculate pawn penalties
    //Number of pawns in each file
    let human_pawns = [];
    let ai_pawns = [];

    for (let x = 0; x < 8; x++) {

        let h_cnt = 0;
        let a_cnt = 0;

        for (let y = 0; y < 8; y++) {

            let chk_piece = board[y][x];

            if (chk_piece != null && chk_piece instanceof Pawn) {

                if (chk_piece.player == 'human') h_cnt++;
                else a_cnt++;

                //Pawn rank bonuses
                if (x > 1 && x < 6) {

                    //Normalize y to chess rank 1 - 8
                    let rank = (chk_piece.player == 'human') ? Math.abs(y - 7) + 1 : y + 1;

                    switch (x) {

                        case 2:
                            if (chk_piece == 'human' && chk_piece.color == 'white') human += 3.9 * (rank - 2);
                            else if (chk_piece == 'human' && chk_piece.color == 'black') human += 2.3 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'white') ai -= 2.3 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'black') ai -= 3.9 * (rank - 2);
                            break;

                        case 3:
                            if (chk_piece == 'human' && chk_piece.color == 'white') human += 5.4 * (rank - 2);
                            else if (chk_piece == 'human' && chk_piece.color == 'black') human += 7.0 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'white') ai -= 7.0 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'black') ai -= 5.4 * (rank - 2);
                            break;

                        case 4:
                            if (chk_piece == 'human' && chk_piece.color == 'white') human += 7.0 * (rank - 2);
                            else if (chk_piece == 'human' && chk_piece.color == 'black') human += 5.4 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'white') ai -= 5.4 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'black') ai -= 7.0 * (rank - 2);
                            break;

                        case 5:
                            if (chk_piece == 'human' && chk_piece.color == 'white') human += 2.3 * (rank - 2);
                            else if (chk_piece == 'human' && chk_piece.color == 'black') human += 3.9 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'white') ai -= 3.9 * (rank - 2);
                            else if (chk_piece == 'ai' && chk_piece.color == 'black') ai -= 2.3 * (rank - 2);
                            break;

                    }

                }

            }

        }

        human_pawns.push(h_cnt);
        ai_pawns.push(a_cnt);

    }

    for (let i = 0; i < 8; i++) {

        //Doubled pawn penalty
        if (human_pawns[i] > 1) human -= (8 * human_pawns[i]);
        if (ai_pawns[i] > 1) ai += (8 * ai_pawns[i]);

        //Isolated pawn penalties
        if (i == 0) {
            if (human_pawns[i] > 0 && human_pawns[i + 1] == 0) human -= (10 * human_pawns[i]);
            if (ai_pawns[i] > 0 && ai_pawns[i + 1] == 0) ai += (10 * ai_pawns[i]);
        }
        else if (i == 7) {
            if (human_pawns[i] > 0 && human_pawns[i - 1] == 0) human -= (10 * human_pawns[i]);
            if (ai_pawns[i] > 0 && ai_pawns[i - 1] == 0) ai += (10 * ai_pawns[i]);
        }
        else {
            if (human_pawns[i] > 0 && human_pawns[i - 1] == 0 && human_pawns[i + 1] == 0) human -= (10 * human_pawns[i]);
            if (ai_pawns[i] > 0 && ai_pawns[i - 1] == 0 && ai_pawns[i + 1] == 0) ai += (10 * ai_pawns[i]);
        }

    }

    //Get material score
    for (let y = 0; y < 8; y++) {

        for (let x = 0; x < 8; x++) {

            if (board[y][x] != null) {

                let piece = board[y][x];

                //Material
                if (piece.player == 'human') human += piece.score;
                else ai += piece.score;                

                //Knight bonuses/penalties                
                if (piece instanceof Knight) {

                    //Center tropism
                    let c_dx = Math.abs(3.5 - x);
                    let c_dy = Math.abs(3.5 - y);

                    let c_sum = 1.6 * (6 - 2 * (c_dx + c_dy));

                    if (piece.player == 'human') human += c_sum;
                    else ai -= c_sum;

                    //King tropism
                    if (piece.player == 'human') {

                        let k_dx = Math.abs(_cking.x - x);
                        let k_dy = Math.abs(_cking.y - y);

                        let k_sum = 1.2 * (5 - (k_dx + k_dy));

                        human += k_sum;


                    } else {

                        let k_dx = Math.abs(_pking.x - x);
                        let k_dy = Math.abs(_pking.y - y);

                        let k_sum = 1.2 * (5 - (k_dx + k_dy));

                        ai -= k_sum;

                    }

                }

                //Rook bonuses/penalties
                else if (piece instanceof Rook) {

                    //Seventh rank bonus
                    if (piece.player == 'human' && y == 1) human += 22;
                    else if (piece.player == 'ai' && y == 6) ai -= 22;

                    //King tropism
                    if (piece.player == 'human') {

                        let k_dx = Math.abs(_cking.x - x);
                        let k_dy = Math.abs(_cking.y - y);

                        let k_sum = -1.6 * Math.min(k_dx, k_dy);

                        human += k_sum;

                    } else {

                        let k_dx = Math.abs(_pking.x - x);
                        let k_dy = Math.abs(_pking.y - y);

                        let k_sum = -1.6 * Math.min(k_dx, k_dy);

                        ai -= k_sum;

                    }

                    //Doubled rook bonus
                    //Check rank
                    let left_chk = true;
                    let right_chk = true;
                    let up_chk = true;
                    let down_chk = true;
                    for (let i = 1; i < 8; i++) {

                        if (!left_chk && !right_chk && !down_chk && !up_chk) break;

                        //Check left side
                        if (x - i >= 0 && left_chk) {

                            let chk_piece = board[y][x - i];
                            if (chk_piece != null) {
                                if (chk_piece instanceof Rook && chk_piece.player == piece.player) break;
                                else left_chk = false;
                            }

                        } else left_chk = false;

                        //Check right side
                        if (x + i < 8 && right_chk) {

                            let chk_piece = board[y][x + i];
                            if (chk_piece != null) {
                                if (chk_piece instanceof Rook && chk_piece.player == piece.player) break;
                                else right_chk = false;
                            }

                        } else right_chk = false;

                        //Check up side
                        if (y - i >= 0 && up_chk) {

                            let chk_piece = board[y - i][x];
                            if (chk_piece != null) {
                                if (chk_piece instanceof Rook && chk_piece.player == piece.player) break;
                                else up_chk = false;
                            }

                        } else up_chk = false;

                        //Check down side
                        if (y + i < 8 && down_chk) {

                            let chk_piece = board[y + i][x];
                            if (chk_piece != null) {
                                if (chk_piece instanceof Rook && chk_piece.player == piece.player) break;
                                else down_chk = false;
                            }

                        } else down_chk = false;

                    }

                    //Doubled rook found
                    if (left_chk || right_chk || down_chk || up_chk) {

                        if (piece.player == 'human') human += 8;
                        else ai -= 8;

                    }

                    //Open file bonus
                    let open_file = true;

                    for (let i = 1; i < 8; i++) {

                        //Check up
                        if (y - i >= 0) {

                            let chk_piece = board[y - i][x];
                            if (chk_piece != null) {
                                if (chk_piece instanceof Pawn) {
                                    open_file = false;
                                    break;
                                }
                            }

                        }

                        //Check down
                        if (y + i < 8) {

                            let chk_piece = board[y + i][x];
                            if (chk_piece != null) {
                                if (chk_piece instanceof Pawn) {
                                    open_file = false;
                                    break;
                                }
                            }

                        }

                    }

                    if (open_file) {

                        if (piece.player == 'human') human += 8;
                        else ai -= 8;

                    }


                }

                //Queen bonuses/penalties
                else if (piece instanceof Queen) {

                    //King tropism
                    if (piece.player == 'human') {

                        let k_dx = Math.abs(_cking.x - x);
                        let k_dy = Math.abs(_cking.y - y);

                        let k_sum = -0.8 * Math.min(k_dx, k_dy);

                        human += k_sum;


                    } else {

                        let k_dx = Math.abs(_pking.x - x);
                        let k_dy = Math.abs(_pking.y - y);

                        let k_sum = -0.8 * Math.min(k_dx, k_dy);

                        ai -= k_sum;

                    }

                }

                //King bonuses/penalties
                else if (piece instanceof King) {

                    //Cant castle penalty
                    if (!piece.hasCastled) {

                        //Castling no longer possible as king has moved at least once
                        if (!piece.firstMove) {

                            if (piece.player == 'human') human -= 15;
                            else ai += 15;

                        } else {

                            //Rooks
                            let q_rook;
                            let k_rook;

                            //Check flags, true if castling is available
                            let q_rook_chk = false;
                            let k_rook_chk = false;

                            if (piece.player == 'human') {

                                if (piece.color == 'white') {

                                    q_rook = castleRook(piece, x - 2, y);
                                    k_rook = castleRook(piece, x + 2, y);

                                } else {

                                    q_rook = castleRook(piece, x + 2, y);
                                    k_rook = castleRook(piece, x - 2, y);

                                }

                            } else {

                                if (piece.color == 'white') {

                                    q_rook = castleRook(piece, x + 2, y);
                                    k_rook = castleRook(piece, x - 2, y);

                                } else {

                                    q_rook = castleRook(piece, x - 2, y);
                                    k_rook = castleRook(piece, x + 2, y);

                                }

                            }

                            q_rook_chk = q_rook != null && q_rook.firstMove;
                            k_rook_chk = k_rook != null && k_rook.firstMove;

                            //Castling no longer available
                            if (!q_rook_chk && !k_rook_chk) {

                                if (piece.player == 'human') human -= 15;
                                else ai += 15;
                    
                            }
                            //Queen side castling not available
                            else if (!q_rook_chk) {

                                if (piece.player == 'human') human -= 8;
                                else ai += 8;

                            }
                            //King side castling not available
                            else if (!k_rook_chk) {

                                if (piece.player == 'human') human -= 12;
                                else ai += 12;

                            }

                        }

                        //Check kings quadrant
                        let enemy_pieces = 0;
                        let friendly_pieces = 0;

                        //Find quadrant
                        //Top/Left
                        if (y < 4 && x < 4) {

                            for (let i = 0; i < 4; i++) {

                                for (let j = 0; j < 4; j++) {

                                    let chk_piece = board[i][j];
                                    if (chk_piece != null) {

                                        //Skip this cell as this is the king
                                        if (i == y && x == j) continue;

                                        //Enemy piece found
                                        if (piece.player != chk_piece.player) {

                                            if (chk_piece instanceof Queen) enemy_pieces += 3;
                                            else enemy_pieces++;

                                        }
                                        //Friendly piece found
                                        else {

                                            if (chk_piece instanceof Queen) friendly_pieces += 3;
                                            else friendly_pieces++;

                                        }

                                    }

                                }

                            }

                        }
                        //Top/Right
                        else if (y < 4 && x >= 4) {

                            for (let i = 0; i < 4; i++) {

                                for (let j = 4; j < 8; j++) {

                                    let chk_piece = board[i][j];
                                    if (chk_piece != null) {

                                        //Skip this cell as this is the king
                                        if (i == y && x == j) continue;

                                        //Enemy piece found
                                        if (piece.player != chk_piece.player) {

                                            if (chk_piece instanceof Queen) enemy_pieces += 3;
                                            else enemy_pieces++;

                                        }
                                        //Friendly piece found
                                        else {

                                            if (chk_piece instanceof Queen) friendly_pieces += 3;
                                            else friendly_pieces++;

                                        }

                                    }

                                }

                            }

                        }
                        //Bottom/Left
                        else if (y >= 4 && x < 4) {

                            for (let i = 4; i < 8; i++) {

                                for (let j = 0; j < 4; j++) {

                                    let chk_piece = board[i][j];
                                    if (chk_piece != null) {

                                        //Skip this cell as this is the king
                                        if (i == y && x == j) continue;

                                        //Enemy piece found
                                        if (piece.player != chk_piece.player) {

                                            if (chk_piece instanceof Queen) enemy_pieces += 3;
                                            else enemy_pieces++;

                                        }
                                        //Friendly piece found
                                        else {

                                            if (chk_piece instanceof Queen) friendly_pieces += 3;
                                            else friendly_pieces++;

                                        }

                                    }

                                }

                            }

                        }
                        //Bottom/Right
                        else {

                            for (let i = 4; i < 8; i++) {

                                for (let j = 4; j < 8; j++) {

                                    let chk_piece = board[i][j];
                                    if (chk_piece != null) {

                                        //Skip this cell as this is the king
                                        if (i == y && x == j) continue;

                                        //Enemy piece found
                                        if (piece.player != chk_piece.player) {

                                            if (chk_piece instanceof Queen) enemy_pieces += 3;
                                            else enemy_pieces++;

                                        }
                                        //Friendly piece found
                                        else {

                                            if (chk_piece instanceof Queen) friendly_pieces += 3;
                                            else friendly_pieces++;

                                        }

                                    }

                                }

                            }

                        }

                        if (enemy_pieces > friendly_pieces) {

                            let diff = enemy_pieces - friendly_pieces;

                            if (piece.player == 'human') human -= (5 * diff);
                            else ai += (5 * diff);

                        }

                    }

                }

                //Bishop bonuses/penalties
                if (piece instanceof Bishop) {

                    //Back rank penalty
                    if (piece.player == 'human' && y == 7) human -= 11;
                    else if (piece.player == 'ai' && y == 0) ai += 11;

                    //Bishop pair bonus
                    let pair = false;

                    for (let i = 0; i < 8; i++) {

                        for (let j = 0; j < 8; j++) {

                            if (i == y && j == x) continue;

                            let chk_piece = board[i][j];

                            if (chk_piece != null && chk_piece.player == piece.player && chk_piece instanceof Bishop) {
                                pair = true;
                                break;
                            }

                        }

                    }

                    if (pair && piece.player == 'human') human += 50;
                    else if (pair && piece.player == 'ai') ai -= 50;

                    //Pawn penalties
                    let p_cntr = 0;

                    //Top left
                    if (x - 1 >= 0 && y - 1 >= 0 && board[y - 1][x - 1] != null && board[y - 1][x - 1] instanceof Pawn) p_cntr++;

                    //Top right
                    if (x + 1 < 8 && y - 1 >= 0 && board[y - 1][x + 1] != null && board[y - 1][x + 1] instanceof Pawn) p_cntr++;

                    //Bottom left
                    if (x - 1 >= 0 && y + 1 < 8 && board[y + 1][x - 1] != null && board[y + 1][x - 1] instanceof Pawn) p_cntr++;

                    //Bottom right
                    if (x + 1 < 8 && y + 1 < 8 && board[y + 1][x + 1] != null && board[y + 1][x + 1] instanceof Pawn) p_cntr++;

                    if (piece.player == 'human') human -= (p_cntr * 3);
                    else ai += (p_cntr * 3);

                }


                
            }

        }

    }

    return ai + human;

}

//Get a piece from a particular board cell
function getPiece(x, y) {
    return board[y][x];
}

//Convert canvas coordinates to cell numbers
function getCellPos(mx, my) {

    let x = Math.floor(mx / CELL_SIZE);
    let y = Math.floor(my / CELL_SIZE);

    return { x, y };

}

//Convert cell number to the canvas coordinates of the top left corner of a cell
function getCellCoord(cx, cy) {

    let x = (cx * CELL_SIZE);
    let y = (cy * CELL_SIZE);

    return { x, y };
}

//Fill a given cell on the board with colour
function fillCell(cx, cy) {    

    let coords = getCellCoord(cx, cy);
    ctx.fillStyle = ((cx + cy) % 2 == 0) ? "#e6ccab" : "#9d571b";
    ctx.fillRect(coords.x + 1, coords.y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

}

//Clear a piece/cell on canvas layer 2
function clearCell(cx, cy) {

    let coords = getCellCoord(cx, cy);
    ctx2.clearRect(coords.x + 1, coords.y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

}

function isInCheck(king) {    

    let x = king.x;
    let y = king.y;

    //Check for knights
    if (x - 1 >= 0 && y - 2 >= 0) {

        let kn = board[y - 2][x - 1];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x - 2 >= 0 && y - 1 >= 0) {

        let kn = board[y - 1][x - 2];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x + 1 < 8 && y - 2 >= 0) {

        let kn = board[y - 2][x + 1];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x + 2 < 8 && y - 1 >= 0) {

        let kn = board[y - 1][x + 2];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x - 1 >= 0 && y + 2 < 8) {

        let kn = board[y + 2][x - 1];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x - 2 >= 0 && y + 1 < 8) {

        let kn = board[y + 1][x - 2];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x + 1 < 8 && y + 2 < 8) {

        let kn = board[y + 2][x + 1];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }

    if (x + 2 < 8 && y + 1 < 8) {

        let kn = board[y + 1][x + 2];

        if (kn != null && kn instanceof Knight && kn.player != king.player) {
            return true;
        }

    }
    

    //Pawns
    if (king.player == 'human') {

        if (x - 1 >= 0 && y - 1 >= 0 && board[y - 1][x - 1] instanceof Pawn && board[y - 1][x - 1].player != king.player) return true;
        if (x + 1 < 8 && y - 1 >= 0 && board[y - 1][x + 1] instanceof Pawn && board[y - 1][x + 1].player != king.player) return true;


    } else {

        if (x - 1 >= 0 && y + 1 < 8 && board[y + 1][x - 1] instanceof Pawn && board[y + 1][x - 1].player != king.player) return true;
        if (x + 1 < 8 && y + 1 < 8 && board[y + 1][x + 1] instanceof Pawn && board[y + 1][x + 1].player != king.player) return true;

    }

    //Up
    for (let i = 1; i < 8; i++) {

        if (y - i < 0) break;

        let piece = board[y - i][x];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || (piece instanceof Queen || piece instanceof Rook)) return true;
            else break;
        }

    }

    //Down
    for (let i = 1; i < 8; i++) {

        if (y + i >= 8) break;

        let piece = board[y + i][x];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || (piece instanceof Queen || piece instanceof Rook)) return true;
            else break;
        }

    }

    //Left
    for (let i = 1; i < 8; i++) {

        if (x - i < 0) break;

        let piece = board[y][x - i];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || (piece instanceof Queen || piece instanceof Rook)) return true;
            else break;
        }

    }

    //Right
    for (let i = 1; i < 8; i++) {

        if (x + i >= 8) break;

        let piece = board[y][x + i];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || (piece instanceof Queen || piece instanceof Rook)) return true;
            else break;
        }

    }

    //UpLeft
    for (let i = 1; i < 8; i++) {

        if (x - i < 0 || y - i < 0) break;

        let piece = board[y - i][x - i];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || piece instanceof Queen || piece instanceof Bishop) return true;
            else break;
        }

    }

    //UpRight
    for (let i = 1; i < 8; i++) {

        if (x + i >= 8 || y - i < 0) break;

        let piece = board[y - i][x + i];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || piece instanceof Queen || piece instanceof Bishop) return true;
            else break;
        }

    }

    //DownLeft
    for (let i = 1; i < 8; i++) {

        if (x - i < 0 || y + i >= 8) break;

        let piece = board[y + i][x - i];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || piece instanceof Queen || piece instanceof Bishop) return true;
            else break;
        }

    }

    //DownRight
    for (let i = 1; i < 8; i++) {

        if (x + i >= 8 || y + i >= 8) break;

        let piece = board[y + i][x + i];

        if (piece != null) {
            if (piece.player == king.player) break;
            if ((i == 1 && piece instanceof King) || piece instanceof Queen || piece instanceof Bishop) return true;
            else break;
        }

    }

    return false;
}


//-------MINIMAX STUFF---------

//AI's next move
function nextMove() {

    nodes = 0;
    leaves = 0;

    console.time("ai move");

    let alpha = -Infinity;
    let beta = Infinity;

    let bestScore = Infinity;
    let bestPiecePos = null;
    let bestMove = null;

    if (opening) {

        if (move_n >= opening_move.length) {
            opening = false;
        }
        else {

            let next_move = opening_move[move_n].move;
            let next_piece = opening_move[move_n].piece;

            if (isAiMoveValid(board[next_piece.y][next_piece.x], next_move.x, next_move.y)) {

                bestPiecePos = next_piece;
                bestMove = next_move;

            }
            else {

                opening = false;

            }

            move_n++;

        }   
        
    }

    if (!opening) {

        for (let y = 0; y < CELLS; y++) {

            for (let x = 0; x < CELLS; x++) {

                let piece = board[y][x];

                //Find next AI piece
                if (piece != null && piece.player == 'ai') {

                    //Store piece's original position so it can be reverted later
                    let piece_x = piece.x;
                    let piece_y = piece.y;
                    let firstMove;
                    if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                        firstMove = piece.firstMove;
                    }

                    let moves = piece.getMoves();

                    //Loop through piece's possible moves
                    for (let key in moves) {

                        for (let i = 0; i < moves[key].length; i++) {

                            let move = moves[key][i];

                            //Check if move is valid
                            if (isAiMoveValid(piece, move.x, move.y)) {

                                nodes++;

                                //if (key == 'special_l' || key == 'special_r') console.log("king check");

                                //Castling
                                let isCastling = (piece instanceof King && (key == 'special_r' || key == 'special_l'));
                                let rook;
                                let rook_x;
                                let rook_firstMove;

                                if (isCastling) {                                    

                                    rook = castleRook(piece, move.x, move.y);

                                    if (rook == null || !rook.firstMove) {
                                        continue;
                                    } else {

                                        piece.hasCastled = true;

                                        //Store castle rooks original data
                                        rook_x = rook.x;
                                        rook_firstMove = rook.firstMove;

                                        //Move rook
                                        board[rook.y][rook.x] = null;
                                        board[rook.y][rook.castlex] = rook;

                                        //Update pos in rook
                                        rook.x = rook.castlex;
                                        rook.firstMove = false;
                                    }

                                }
                                

                                //Store destination cell's content (piece or null) so it can be reverted
                                let dest_cell = board[move.y][move.x];

                                //Move piece on board
                                board[move.y][move.x] = piece;
                                board[piece.y][piece.x] = null;

                                //Update pos in piece
                                piece.x = move.x;
                                piece.y = move.y;

                                if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                                    piece.firstMove = false;
                                }

                                //Run minimax and calculate score
                                let score = Infinity;

                                if (!isInCheck(_cking)) {
                                    score = alphabetaMax(0, alpha, beta);
                                }

                                if (score < beta) {
                                    beta = score;
                                }

                                //Check if score is better than best score
                                if (score < bestScore) {

                                    bestScore = score;
                                    bestPiecePos = { x: piece_x, y: piece_y };
                                    bestMove = move;

                                }

                                //Revert values
                                board[move.y][move.x] = dest_cell;
                                board[piece_y][piece_x] = piece;
                                piece.x = piece_x;
                                piece.y = piece_y;
                                if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                                    piece.firstMove = firstMove;
                                }

                                if (isCastling) {

                                    piece.hasCastled = false;

                                    //Revert rook values
                                    rook.x = rook_x;
                                    rook.firstMove = rook_firstMove;
                                    board[rook.y][rook.castlex] = null;
                                    board[rook.y][rook.x] = rook;

                                }

                            } else {

                                break;

                            }

                        }

                    }

                }


            }

        }

    }

    if (bestPiecePos == null) {
        alert("You win!");
        console.timeEnd("ai move");
        playerTurn = false;
        return;
    }
    

    //Move piece
    let piece = board[bestPiecePos.y][bestPiecePos.x];

    //Check if it was a castling move
    if (piece instanceof King) {

        //Distance king moved along x axis
        let dx = Math.abs(bestPiecePos.x - bestMove.x);

        //Check if king was moved more than one space
        if (dx > 1) {

            let rook = castleRook(piece, bestMove.x, bestMove.y);

            piece.hasCastled = true;

            //Move rook
            board[rook.y][rook.x] = null;
            board[rook.y][rook.castlex] = rook;

            clearCell(rook.x, rook.y);

            rook.x = rook.castlex;
            rook.firstMove = false;

            drawPiece(rook);

        }

    }

    //Add move notation before updating piece
    addMoveNotation(piece, bestMove.x, bestMove.y);

    board[bestMove.y][bestMove.x] = piece;
    board[piece.y][piece.x] = null;

    //Clear cells
    clearCell(piece.x, piece.y);
    clearCell(bestMove.x, bestMove.y);    

    //Update piece
    piece.x = bestMove.x;
    piece.y = bestMove.y;

    if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {

        if (piece.firstMove) {
            piece.firstMove = false;
        }

    }

    //Draw piece
    drawPiece(piece);

    updateScoreArea();
    updateMoveList();

    if (playerColor == 'white') move_no++;

    playerTurn = true;

    console.timeEnd("ai move");

}

function alphabetaMax(depth, alpha, beta) {

    if (depth > MAX_DEPTH) {
        leaves++;
        return getTotalScore();
    }  

    if (isInCheck(_cking)) {
        leaves++;
        return getTotalScore() + 10000;
    }

    for (let y = 0; y < CELLS; y++) {

        for (let x = 0; x < CELLS; x++) {

            let piece = board[y][x];

            //Find next human piece
            if (piece != null && piece.player == 'human') {

                //Store piece's original position so it can be reverted later
                let piece_x = piece.x;
                let piece_y = piece.y;
                let firstMove;
                if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                    firstMove = piece.firstMove;
                }

                let moves = piece.getMoves();

                //Loop through piece's possible moves
                for (let key in moves) {

                    for (let i = 0; i < moves[key].length; i++) {

                        let move = moves[key][i];

                        //Check if move is valid
                        if (isAiMoveValid(piece, move.x, move.y)) {

                            nodes++;

                            //Castling
                            let isCastling = (piece instanceof King && (key == 'special_r' || key == 'special_l'));
                            let rook;
                            let rook_x;
                            let rook_firstMove;

                            if (isCastling) {

                                rook = castleRook(piece, move.x, move.y);

                                if (rook == null || !rook.firstMove) {
                                    continue;
                                } else {

                                    piece.hasCastled = true;

                                    //Store castle rooks original data
                                    rook_x = rook.x;
                                    rook_firstMove = rook.firstMove;

                                    //Move rook
                                    board[rook.y][rook.x] = null;
                                    board[rook.y][rook.castlex] = rook;

                                    //Update pos in rook
                                    rook.x = rook.castlex;
                                    rook.firstMove = false;
                                }

                            }

                            //Store destination cell's content (piece or null) so it can be reverted
                            let dest_cell = board[move.y][move.x];

                            //Move piece on board
                            board[move.y][move.x] = piece;
                            board[piece.y][piece.x] = null;

                            //Update pos in piece
                            piece.x = move.x;
                            piece.y = move.y;

                            if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                                piece.firstMove = false;
                            }

                            //Run minimax and calculate score
                            let score = alphabetaMin(depth + 1, alpha, beta);                            

                            //Revert values
                            board[move.y][move.x] = dest_cell;
                            board[piece_y][piece_x] = piece;
                            piece.x = piece_x;
                            piece.y = piece_y;
                            if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                                piece.firstMove = firstMove;
                            }

                            if (isCastling) {

                                piece.hasCastled = false;

                                //Revert rook values
                                rook.x = rook_x;
                                rook.firstMove = rook_firstMove;
                                board[rook.y][rook.castlex] = null;
                                board[rook.y][rook.x] = rook;

                            }

                            //Alpha beta pruning stuff
                            if (score >= beta) {
                                return beta;
                            }

                            if (score > alpha) {
                                alpha = score;
                            }

                        } else {

                            break;

                        }

                    }

                }

            }


        }

    }

    return alpha;

}

function alphabetaMin(depth, alpha, beta) {

    if (depth > MAX_DEPTH) {
        leaves++;
        return getTotalScore();
    }

    if (isInCheck(_pking)) {
        leaves++;
        return getTotalScore() - 10000;
    }

    for (let y = 0; y < CELLS; y++) {

        for (let x = 0; x < CELLS; x++) {

            let piece = board[y][x];

            //Find next AI piece
            if (piece != null && piece.player == 'ai') {

                //Store piece's original position so it can be reverted later
                let piece_x = piece.x;
                let piece_y = piece.y;
                let firstMove;
                if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                    firstMove = piece.firstMove;
                }

                let moves = piece.getMoves();

                //Loop through piece's possible moves
                for (let key in moves) {

                    for (let i = 0; i < moves[key].length; i++) {

                        let move = moves[key][i];

                        //Check if move is valid
                        if (isAiMoveValid(piece, move.x, move.y)) {

                            nodes++;

                            //Castling
                            let isCastling = (piece instanceof King && (key == 'special_r' || key == 'special_l'));
                            let rook;
                            let rook_x;
                            let rook_firstMove;

                            if (isCastling) {

                                rook = castleRook(piece, move.x, move.y);

                                if (rook == null || !rook.firstMove) {
                                    continue;
                                } else {

                                    piece.hasCastled = true;

                                    //Store castle rooks original data
                                    rook_x = rook.x;
                                    rook_firstMove = rook.firstMove;

                                    //Move rook
                                    board[rook.y][rook.x] = null;
                                    board[rook.y][rook.castlex] = rook;

                                    //Update pos in rook
                                    rook.x = rook.castlex;
                                    rook.firstMove = false;
                                }

                            }

                            //Store destination cell's content (piece or null) so it can be reverted
                            let dest_cell = board[move.y][move.x];

                            //Move piece on board
                            board[move.y][move.x] = piece;
                            board[piece.y][piece.x] = null;

                            //Update pos in piece
                            piece.x = move.x;
                            piece.y = move.y;

                            if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                                piece.firstMove = false;
                            }

                            //Run minimax and calculate score
                            let score = alphabetaMax(depth + 1, alpha, beta);
                            

                            //Revert values
                            board[move.y][move.x] = dest_cell;
                            board[piece_y][piece_x] = piece;
                            piece.x = piece_x;
                            piece.y = piece_y;
                            if (piece instanceof Pawn || piece instanceof King || piece instanceof Rook) {
                                piece.firstMove = firstMove;
                            }

                            if (isCastling) {

                                piece.hasCastled = false;

                                //Revert rook values
                                rook.x = rook_x;
                                rook.firstMove = rook_firstMove;
                                board[rook.y][rook.castlex] = null;
                                board[rook.y][rook.x] = rook;

                            }

                            //Alpha beta pruning stuff
                            if (score <= alpha) {
                                return alpha;
                            }

                            if (score < beta) {
                                beta = score;
                            }

                        } else {

                            break;

                        }

                    }

                }

            }


        }

    }

    return beta;
}

