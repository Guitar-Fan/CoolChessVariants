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
    getPossibleMoves(boardState, allowTunneling = false) {
        return [];
    }

    // Get moves that can tunnel through adjacent pieces
    getTunnelMoves(boardState) {
        const moves = [];
        const [col, row] = boardState.getCoords(this.position);
        
        // Check all 8 directions around the piece
        for (let dCol = -1; dCol <= 1; dCol++) {
            for (let dRow = -1; dRow <= 1; dRow++) {
                if (dCol === 0 && dRow === 0) continue;
                
                const adjacentPos = boardState.getPosition(col + dCol, row + dRow);
                if (adjacentPos && boardState.getPiece(adjacentPos)) {
                    // There's a piece adjacent, can we tunnel through it?
                    const tunnelTarget = boardState.getPosition(col + 2 * dCol, row + 2 * dRow);
                    if (tunnelTarget && !boardState.getPiece(tunnelTarget)) {
                        moves.push(tunnelTarget);
                    }
                }
            }
        }
        return moves;
    }
}

class Pawn extends Piece {
    constructor(color, position) {
        super(color, position);
        this.hasMoved = false;
        this.enPassantTarget = false; // Can this pawn be captured en passant?
    }

    getPossibleMoves(boardState) {
        // Pawn logic is always the most annoying to code.
        const moves = [];
        const [col, row] = boardState.getCoords(this.position);
        const direction = this.color === 'w' ? 1 : -1;
        const startRow = this.color === 'w' ? 2 : 7;

        // Standard 1-step move
        let oneStep = boardState.getPosition(col, row + direction);
        if (oneStep && !boardState.getPiece(oneStep)) {
            moves.push(oneStep);
            
            // 2-step move from start
            if (row === startRow) {
                let twoStep = boardState.getPosition(col, row + 2 * direction);
                if (twoStep && !boardState.getPiece(twoStep)) {
                    moves.push(twoStep);
                }
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
                
                // En passant capture
                const adjacentPos = boardState.getPosition(c, row);
                if (adjacentPos) {
                    const adjacentPiece = boardState.getPiece(adjacentPos);
                    if (adjacentPiece && 
                        adjacentPiece.type === 'pawn' &&
                        adjacentPiece.color !== this.color &&
                        adjacentPiece.enPassantTarget &&
                        ((this.color === 'w' && row === 5) || (this.color === 'b' && row === 4))) {
                        moves.push(capturePos);
                    }
                }
            }
        }
        
        return moves;
    }
}

class Rook extends Piece {
    constructor(color, position) {
        super(color, position);
        this.hasMoved = false;
    }

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
    constructor(color, position) {
        super(color, position);
        this.hasMoved = false;
    }

    getPossibleMoves(boardState) {
        const moves = [];
        const [col, row] = boardState.getCoords(this.position);
        
        // Standard king moves
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

        // Castling
        if (!this.hasMoved && !boardState.isInCheck && !boardState.isInCheck(this.color)) {
            const backRank = this.color === 'w' ? 1 : 8;
            
            // Kingside castling
            const kingsideRook = boardState.getPiece(boardState.getPosition(7, backRank));
            if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
                const f1 = boardState.getPosition(5, backRank);
                const g1 = boardState.getPosition(6, backRank);
                if (!boardState.getPiece(f1) && !boardState.getPiece(g1)) {
                    // Check if squares between king and rook are not under attack
                    if (!boardState.isSquareUnderAttack(f1, this.color === 'w' ? 'b' : 'w') &&
                        !boardState.isSquareUnderAttack(g1, this.color === 'w' ? 'b' : 'w')) {
                        moves.push(g1);
                    }
                }
            }
            
            // Queenside castling
            const queensideRook = boardState.getPiece(boardState.getPosition(0, backRank));
            if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
                const d1 = boardState.getPosition(3, backRank);
                const c1 = boardState.getPosition(2, backRank);
                const b1 = boardState.getPosition(1, backRank);
                if (!boardState.getPiece(d1) && !boardState.getPiece(c1) && !boardState.getPiece(b1)) {
                    // Check if squares between king and rook are not under attack
                    if (!boardState.isSquareUnderAttack(d1, this.color === 'w' ? 'b' : 'w') &&
                        !boardState.isSquareUnderAttack(c1, this.color === 'w' ? 'b' : 'w')) {
                        moves.push(c1);
                    }
                }
            }
        }
        
        return moves;
    }
}