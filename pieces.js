// js/pieces.js

// Using a class-based approach because it's clean for this kind of thing.
// A human might do this, or they might use factory functions. I like classes today.

class Piece {
    constructor(color, position) {
        this.color = color; // 'w' or 'b'
        this.position = position; // e.g., 'e4'
        this.type = this.constructor.name.toLowerCase();
        
        // Quantum properties
        this.inSuperposition = false;
        this.quantumPositions = []; // Will hold two positions if in superposition
    }
    
    // a basic representation
    get id() {
        return `${this.color}-${this.type}-${this.position}`;
    }

    // This will be overridden by each specific piece
    getPossibleMoves(boardState) {
        return [];
    }
}

class Pawn extends Piece {
    constructor(color, position) {
        super(color, position);
        this.hasMoved = false;
    }

    getPossibleMoves(boardState) {
        // Pawn logic is always the most annoying to code.
        const moves = [];
        const [col, row] = boardState.getCoords(this.position);
        const direction = this.color === 'w' ? 1 : -1;

        // Standard 1-step move
        let oneStep = boardState.getPosition(col, row + direction);
        if (oneStep && !boardState.getPiece(oneStep)) {
            moves.push(oneStep);
        }

        // 2-step move from start
        if (!this.hasMoved) {
            let twoStep = boardState.getPosition(col, row + 2 * direction);
            if (oneStep && !boardState.getPiece(oneStep) && twoStep && !boardState.getPiece(twoStep)) {
                moves.push(twoStep);
            }
        }

        // Captures
        const captureCols = [col - 1, col + 1];
        for (const c of captureCols) {
            let capturePos = boardState.getPosition(c, row + direction);
            if (capturePos) {
                const targetPiece = boardState.getPiece(capturePos);
                if (targetPiece && targetPiece.color !== this.color) {
                    moves.push(capturePos);
                }
            }
        }
        
        return moves;
    }
}

class Rook extends Piece {
    getPossibleMoves(boardState) {
        return boardState.getStraightMoves(this.position, this.color);
    }
}

class Knight extends Piece {
     getPossibleMoves(boardState) {
        const moves = [];
        const [col, row] = boardState.getCoords(this.position);
        const offsets = [
            [1, 2], [1, -2], [-1, 2], [-1, -2],
            [2, 1], [2, -1], [-2, 1], [-2, -1]
        ];

        for (const [dCol, dRow] of offsets) {
            const newCol = col + dCol;
            const newRow = row + dRow;
            const targetPos = boardState.getPosition(newCol, newRow);

            if (targetPos) {
                const targetPiece = boardState.getPiece(targetPos);
                if (!targetPiece || targetPiece.color !== this.color) {
                    moves.push(targetPos);
                }
            }
        }
        return moves;
    }
}

class Bishop extends Piece {
    getPossibleMoves(boardState) {
        return boardState.getDiagonalMoves(this.position, this.color);
    }
}

class Queen extends Piece {
    getPossibleMoves(boardState) {
        // Queen is just a rook and a bishop combined. Easy peasy.
        const straightMoves = boardState.getStraightMoves(this.position, this.color);
        const diagonalMoves = boardState.getDiagonalMoves(this.position, this.color);
        return [...straightMoves, ...diagonalMoves];
    }
}

class King extends Piece {
    getPossibleMoves(boardState) {
        const moves = [];
        const [col, row] = boardState.getCoords(this.position);
        
        for (let dCol = -1; dCol <= 1; dCol++) {
            for (let dRow = -1; dRow <= 1; dRow++) {
                if (dCol === 0 && dRow === 0) continue;

                const targetPos = boardState.getPosition(col + dCol, row + dRow);
                if (targetPos) {
                    const targetPiece = boardState.getPiece(targetPos);
                    if (!targetPiece || targetPiece.color !== this.color) {
                        moves.push(targetPos);
                    }
                }
            }
        }
        return moves;
    }
}