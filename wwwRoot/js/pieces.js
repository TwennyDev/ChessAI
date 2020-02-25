class Piece {

    constructor(x, y, color, image, player) {
        this.x = x;
        this.y = y;
        this.player = player;

        this.color = color;
        this.imagew = image.width / 6;
        this.imageh = image.height / 2;
    }

}

class Pawn extends Piece {

    constructor(x, y, color, image, player) {

        super(x, y, color, image, player);  

        this.imagex = 5 * this.imagew;
        this.firstMove = true;

        if (color == 'white') {
            this.imagey = 1 * this.imageh;
        } else {
            this.imagey = 0;
        }

        this.score = (player == 'human') ? 100 : -100;

    }

    getMoves() {

        let moves = {
            up: [],
            down: [],
            left: [],
            right: [],
            upLeft: [],
            upRight: [],
            downLeft: [],
            downRight: []
        };

        if (this.player == 'ai') {

            //Normal moves
            if (this.y + 1 < 8) {
                moves.down.push({ x: this.x, y: this.y + 1 });
            }

            if (this.firstMove) {
                moves.down.push({ x: this.x, y: this.y + 2 });
            }

            //Take moves
            if (this.y + 1 < 8 && this.x + 1 < 8) {
                moves.downRight.push({ x: this.x + 1, y: this.y + 1 });
            }

            if (this.y + 1 < 8 && this.x - 1 >= 0) {
                moves.downLeft.push({ x: this.x - 1, y: this.y + 1 });
            }

        } else {

            //Normal moves
            if (this.y - 1 >= 0) {
                moves.up.push({ x: this.x, y: this.y - 1 });
            }

            if (this.firstMove) {
                moves.up.push({ x: this.x, y: this.y - 2 });
            }

            //Take moves
            if (this.y - 1 >= 0 && this.x + 1 < 8) {
                moves.upRight.push({ x: this.x + 1, y: this.y - 1 });
            }

            if (this.y - 1 >= 0 && this.x - 1 >= 0) {
                moves.upLeft.push({ x: this.x - 1, y: this.y - 1 });
            }
        }        

        return moves;
    }

}

class Rook extends Piece {

    constructor(x, y, color, image, player) {

        super(x, y, color, image, player);

        this.imagex = 0;
        this.firstMove = true;

        if (color == 'white') {
            this.imagey = 1 * this.imageh;            

            if (player == 'human') {
                if (this.x == 0) this.castlex = 3;
                if (this.x == 7) this.castlex = 5;
            } else {
                if (this.x == 0) this.castlex = 2;
                if (this.x == 7) this.castlex = 4;
            }
                       

        } else {
            this.imagey = 0;

            if (player == 'human') {
                if (this.x == 0) this.castlex = 2;
                if (this.x == 7) this.castlex = 4;
            } else {
                if (this.x == 0) this.castlex = 3;
                if (this.x == 7) this.castlex = 5;
            }
               
        }

        this.score = (player == 'human') ? 500 : -500;

    }

    getMoves() {

        let moves = {
            up: [],
            down: [],
            left: [],
            right: [],
            upLeft: [],
            upRight: [],
            downLeft: [],
            downRight: []
        };

        for (let i = 1; i < 8; i++) {

            //Vertical
            //Up
            if (this.y - i >= 0) {
                moves.up.push({ x: this.x, y: this.y - i });
            }

            //Down
            if (this.y + i < 8) {
                moves.down.push({ x: this.x, y: this.y + i });
            }

            //Horizontal
            //Left
            if (this.x - i >= 0) {
                moves.left.push({ x: this.x - i, y: this.y });
            }

            //Right
            if (this.x + i < 8) {
                moves.right.push({ x: this.x + i, y: this.y });
            }

        }

        return moves;

    }

}

class Bishop extends Piece {

    constructor(x, y, color, image, player) {

        super(x, y, color, image, player);

        this.imagex = 1 * this.imagew;

        if (color == 'white') {
            this.imagey = 1 * this.imageh;
        } else {
            this.imagey = 0;
        }

        this.score = (player == 'human') ? 350 : -350;

    }

    getMoves() {

        let moves = {
            up: [],
            down: [],
            left: [],
            right: [],
            upLeft: [],
            upRight: [],
            downLeft: [],
            downRight: []
        };

        for (let i = 1; i < 8; i++) {

            //Left/Up
            if (this.x - i >= 0 && this.y - i >= 0) {
                moves.upLeft.push({ x: this.x - i, y: this.y - i });
            }

            //Right/Up
            if (this.x + i < 8 && this.y - i >= 0) {
                moves.upRight.push({ x: this.x + i, y: this.y - i });
            }

            //Left/Down
            if (this.x - i >= 0 && this.y + i < 8) {
                moves.downLeft.push({ x: this.x - i, y: this.y + i });
            }

            //Right/Down
            if (this.x + i < 8 && this.y + i < 8) {
                moves.downRight.push({ x: this.x + i, y: this.y + i });
            }

        }

        return moves;

    }

}

class King extends Piece {

    constructor(x, y, color, image, player) {

        super(x, y, color, image, player);

        this.imagex = 3 * this.imagew;
        this.firstMove = true;
        this.hasCastled = false;

        if (color == 'white') {
            this.imagey = 1 * this.imageh;
        } else {
            this.imagey = 0;
        }

        this.score = 0;

    }

    getMoves() {

        let moves = {
            special_r: [],
            special_l:[],
            up: [],
            down: [],
            left: [],
            right: [],
            upLeft: [],
            upRight: [],
            downLeft: [],
            downRight: []
        };

        if (this.firstMove) {

            //Special i.e. castling
            if (this.x + 2 < 8) moves.special_r.push({ x: this.x + 2, y: this.y });

            if (this.x - 2 >= 0) moves.special_l.push({ x: this.x - 2, y: this.y });

        }
        

        //Up
        if (this.y - 1 >= 0) moves.up.push({ x: this.x, y: this.y - 1 });

        //Down
        if (this.y + 1 < 8) moves.down.push({ x: this.x, y: this.y + 1 });

        //Left
        if (this.x - 1 >= 0) moves.left.push({ x: this.x - 1, y: this.y });

        //Right
        if (this.x + 1 < 8) moves.right.push({ x: this.x + 1, y: this.y });

        //UpLeft
        if (this.x - 1 >= 0 && this.y - 1 >= 0) moves.upLeft.push({ x: this.x - 1, y: this.y - 1 });

        //UpRight
        if (this.x + 1 < 8 && this.y - 1 >= 0) moves.upRight.push({ x: this.x + 1, y: this.y - 1 });

        //DownLeft
        if (this.x - 1 >= 0 && this.y + 1 < 8) moves.downLeft.push({ x: this.x - 1, y: this.y + 1 });

        //DownRight
        if (this.x + 1 < 8 && this.y + 1 < 8) moves.downRight.push({ x: this.x + 1, y: this.y + 1 });

        return moves;


    }

}

class Queen extends Piece {

    constructor(x, y, color, image, player) {

        super(x, y, color, image, player);

        this.imagex = 2 * this.imagew;

        if (color == 'white') {
            this.imagey = 1 * this.imageh;
        } else {
            this.imagey = 0;
        }

        this.score = (player == 'human') ? 900 : -900;

    }

    getMoves() {

        let moves = {
            up: [],
            down: [],
            left: [],
            right: [],
            upLeft: [],
            upRight: [],
            downLeft: [],
            downRight: []
        };

        for (let i = 1; i < 8; i++) {

            //Up
            if (this.y - i >= 0) moves.up.push({ x: this.x, y: this.y - i });

            //Down
            if (this.y + i < 8) moves.down.push({ x: this.x, y: this.y + i });

            //Left
            if (this.x - i >= 0) moves.left.push({ x: this.x - i, y: this.y });

            //Right
            if (this.x + i < 8) moves.right.push({ x: this.x + i, y: this.y });

            //UpLeft
            if (this.x - i >= 0 && this.y - i >= 0) moves.upLeft.push({ x: this.x - i, y: this.y - i });

            //UpRight
            if (this.x + i < 8 && this.y - i >= 0) moves.upRight.push({ x: this.x + i, y: this.y - i });

            //DownLeft
            if (this.x - i >= 0 && this.y + i < 8) moves.downLeft.push({ x: this.x - i, y: this.y + i });

            //DownRight
            if (this.x + i < 8 && this.y + i < 8) moves.downRight.push({ x: this.x + i, y: this.y + i });


        }

        return moves;


    }

}

class Knight extends Piece {

    constructor(x, y, color, image, player) {

        super(x, y, color, image, player);

        this.imagex = 4 * this.imagew;

        if (color == 'white') {
            this.imagey = 1 * this.imageh;
        } else {
            this.imagey = 0;
        }

        this.score = (player == 'human') ? 325 : -325;

    }

    getMoves() {

        let moves = {
            up: [],
            down: [],
            left: [],
            right: [],
            upLeft: [],
            upRight: [],
            downLeft: [],
            downRight: []
        };

        if (this.y - 2 >= 0 && this.x + 1 < 8) moves.up.push({ x: this.x + 1, y: this.y - 2 });
        if (this.y - 2 >= 0 && this.x - 1 >= 0) moves.up.push({ x: this.x - 1, y: this.y - 2 });

        if (this.y - 1 >= 0 && this.x + 2 < 8) moves.up.push({ x: this.x + 2, y: this.y - 1 });
        if (this.y - 1 >= 0 && this.x - 2 >= 0) moves.up.push({ x: this.x - 2, y: this.y - 1 });

        if (this.y + 1 < 8 && this.x + 2 < 8) moves.up.push({ x: this.x + 2, y: this.y + 1 });
        if (this.y + 1 < 8 && this.x - 2 >= 0) moves.up.push({ x: this.x - 2, y: this.y + 1 });

        if (this.y + 2 < 8 && this.x + 1 < 8) moves.up.push({ x: this.x + 1, y: this.y + 2 });
        if (this.y + 2 < 8 && this.x - 1 >= 0) moves.up.push({ x: this.x - 1, y: this.y + 2 });

        return moves;
    }

}