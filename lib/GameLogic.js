const COLUMNS = 5,
    ROWS = 5,
    HEIGHT = 5,
    EMPTY_SPACE = " ",
    PLAYER_1 = "o",
    PLAYER_2 = "x",
    CONNECT = 4;

class Cell {
    xPosition = 0
    yPosition = 0
    content = []

    constructor(xPosition, yPosition) {
        this.xPosition = xPosition;
        this.yPosition = yPosition;

        for (let i=0; i<HEIGHT; i++)
            this.content.push(EMPTY_SPACE)
    }

    addCoin(player) {
        if (this.isComplete()) {
            return false;
        } else {
            this.content[this.content.indexOf(EMPTY_SPACE)] = player
            return true;
        }
    }

    getContent(atHeight) {
        return this.content[atHeight]
    }

    getLastOccupiedLevel() {
        if (this.isComplete())
            return HEIGHT - 1
        return this.content.indexOf(EMPTY_SPACE) - 1
    }

    isComplete() {
        return this.content.indexOf(EMPTY_SPACE) === -1
    }

    getRepres() {
        return this.content.join('')
    }
}

class Game {
    table = []
    turnOf

    constructor() {
        //table initialization
        for (let i = 0; i < ROWS; i++) {
            this.table[i] = []
            for (let j = 0; j < COLUMNS; j++) {
                this.table[i][j] = new Cell(i, j)
            }
        }

        this.turnOf = PLAYER_1

    }

    getContent(x, y, height) {
        this.table[x][y].getContent(height)
    }

    getGame() {
    }

    changeCurrentPlayer() {
        if (this.turnOf === PLAYER_2) {
            this.turnOf = PLAYER_1
        } else {
            this.turnOf = PLAYER_2
        }
    }

    addCoin(a) {

        let coord =  this.getCoordRep(a)
        let x = coord[0]
        let y = coord[1]

        if (this.table[x][y].addCoin(this.turnOf))
            if (this.checkWin(x, y)) {
                playerWon((this.turnOf === "x") ? "dark" : "light")
                console.log("player "+this.turnOf+" won")
                return
            }

        if (this.checkTie()) {
            tie();
            return
        }

        this.changeCurrentPlayer()
    }

    isComplete(a) {
        let coord =  this.getCoordRep(a)
        let x = coord[0]
        let y = coord[1]
        return this.table[x][y].isComplete();
    }

    getLastOccupiedLevel(a) {
        let coord =  this.getCoordRep(a)
        let x = coord[0]
        let y = coord[1]
        return this.table[x][y].getLastOccupiedLevel();
    }

    checkWin(lastX, lastY) {
        let height = this.table[lastX][lastY].getLastOccupiedLevel()
        let values = []

        //check vertically
        if (this.table[lastX][lastY].getRepres().search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check horizontally (row)
        values = []
        for (let i=0; i<COLUMNS; i++) {
            values.push(this.table[lastX][i].getContent(height))
        }

        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check horizontally (column)
        values = []
        for (let i=0; i<ROWS; i++) {
            values.push(this.table[i][lastY].getContent(height))
        }

        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 2D diagonally (row, NE)
        values = []

        let i = 0, j = 0
        for (i=height, j=lastY; i<HEIGHT && j<COLUMNS;) {
            i++;
            j++;
        }
        let endY = j - 1
        let endHeight = i - 1
        for (let i=endHeight, j=endY; i >= 0 && j >= 0; i--, j--)
            values.push(this.table[lastX][j].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 2D diagonally (row, SE)
        values = []
        for (i=height, j=lastY; i<HEIGHT && j>=0;) {
            i++;
            j--;
        }
        let startY = j + 1
        let startHeight = i - 1
        for (let i=startHeight, j=startY; i >= 0 && j<COLUMNS; i--, j++)
            values.push(this.table[lastX][j].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 2D diagonally (column, NE)
        values = []

        for (i=height, j=lastX; i<HEIGHT && j<ROWS;) {
            i++;
            j++;
        }
        let endX = j - 1
        endHeight = i - 1
        for (let i=endHeight, j=endX; i >= 0 && j>=0 ; i--, j--)
            values.push(this.table[j][lastY].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 2D diagonally (column, SE)
        values = []
        for (i=height, j=lastY; i<HEIGHT && j>=0;) {
            i++;
            j--;
        }
        let startX = j + 1
        startHeight = i - 1
        for (let i=startHeight, j=startX; i >= 0 && j<ROWS; i--, j++)
            values.push(this.table[j][lastY].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 3D diagonally (NE, Ascending)

        values = []
        i = 0; j = 0;
        let k = 0;

        for (i=height, j=lastY, k=lastX; i<HEIGHT && j<COLUMNS && k<ROWS;) {
            i++;
            j++;
            k++;
        }
        endY = j - 1
        endHeight = i - 1
        endX = k - 1
        for (let i=endHeight, j=endY, k=endX; i >= 0 && j>=0 && k>=0 ; i--, j--, k--)
            values.push(this.table[k][j].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 3D diagonally (NE, Descending)

        values = []
        for (i=height, j=lastY, k=lastX; i<HEIGHT && j>=0 && k>=0;) {
            i++;
            j--;
            k--;
        }
        startY = j + 1
        startX = k + 1
        startHeight = i - 1

        for (let i=startHeight, j=startY, k=startX; i >= 0 && j<COLUMNS && k<ROWS; i--, j++, k++)
            values.push(this.table[k][j].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 3D diagonally (SW, Descending)

        values = []
        i = 0; j = 0;
        k = 0;

        for (i=height, j=lastY, k=lastX; i<HEIGHT && j<COLUMNS && k>=0;) {
            i++;
            j++;
            k--;
        }
        startY = j - 1
        startHeight = i - 1
        startX = k + 1
        for (let i=endHeight, j=endY, k=endX; i >= 0 && j>=0 && k<ROWS ; i--, j--, k++)
            values.push(this.table[k][j].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }

        //check 3D diagonally (SW, Ascending)

        values = []
        i = 0; j = 0;
        k = 0;

        for (i=height, j=lastY, k=lastX; i<HEIGHT && j>=0 && k<ROWS;) {
            i++;
            j--;
            k++;
        }
        endY = j + 1
        endHeight = i - 1
        endX = k - 1
        for (let i=endHeight, j=endY, k=endX; i >= 0 && j<COLUMNS && k>=0 ; i--, j++, k--)
            values.push(this.table[k][j].getContent(i))
        if (values.join('').search(this.turnOf.repeat(CONNECT)) !== -1) {
            return true;
        }
    }

    getAvailableMoves() {
        const moves = []
        for (let i=0; i<ROWS; i++)
            for (let j=0; j<COLUMNS; j++)
                if (!this.table[i][j].isComplete())
                    moves.push(this.getLinearRep(i, j))

        return moves
    }

    getLinearRep(x, y) {
        return x*COLUMNS + y
    }

    getCoordRep(a) {
        return [Math.floor(a/COLUMNS), a%COLUMNS]
    }

    checkTie() {
        for (let i=0; i<ROWS; i++) {
            for (let j = 0; j < COLUMNS; j++) {
                if (!this.table[i][j].isComplete()) {
                    return false;
                }
            }
        }
        return true;
    }
}
