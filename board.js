// js/board.js

// This object is responsible for everything to do with the board itself,
// both the data and the visual representation. A bit of a god object,
// but for a project this size, it's manageable.

const board = {
    element: document.getElementById('chessboard'),
    squares: {}, // Will store div elements, e.g. {'a1': div}
    pieces: {}, // All piece objects, e.g. {'e1': KingObject}
    cols: 'abcdefgh',

    // Create the visual grid
    drawBoard() {
        this.element.innerHTML = '';
        this.squares = {};
        for (let row = 8; row >= 1; row--) {
            for (let col_idx = 0; col_idx < 8; col_idx++) {
                const col = this.cols[col_idx];
                const squareId = `${col}${row}`;
                const squareDiv = document.createElement('div');
                squareDiv.className = 'square';
                squareDiv.classList.add(((row + col_idx) % 2 === 0) ? 'dark' : 'light');
                squareDiv.dataset.id = squareId;
                
                this.element.appendChild(squareDiv);
                this.squares[squareId] = squareDiv;
            }
        }
    },

    // Place pieces based on initial setup
    setupPieces() {
        this.pieces = {};
        const setup = {
            'a1': new Rook('w', 'a1'), 'h1': new Rook('w', 'h1'),
            'b1': new Knight('w', 'b1'), 'g1': new Knight('w', 'g1'),
            'c1': new Bishop('w', 'c1'), 'f1': new Bishop('w', 'f1'),
            'd1': new Queen('w', 'd1'), 'e1': new King('w', 'e1'),
            'a2': new Pawn('w', 'a2'), 'b2': new Pawn('w', 'b2'), 'c2': new Pawn('w', 'c2'), 'd2': new Pawn('w', 'd2'),
            'e2': new Pawn('w', 'e2'), 'f2': new Pawn('w', 'f2'), 'g2': new Pawn('w', 'g2'), 'h2': new Pawn('w', 'h2'),

            'a8': new Rook('b', 'a8'), 'h8': new Rook('b', 'h8'),
            'b8': new Knight('b', 'b8'), 'g8': new Knight('b', 'g8'),
            'c8': new Bishop('b', 'c8'), 'f8': new Bishop('b', 'f8'),
            'd8': new Queen('b', 'd8'), 'e8': new King('b', 'e8'),
            'a7': new Pawn('b', 'a7'), 'b7': new Pawn('b', 'b7'), 'c7': new Pawn('b', 'c7'), 'd7': new Pawn('b', 'd7'),
            'e7': new Pawn('b', 'e7'), 'f7': new Pawn('b', 'f7'), 'g7': new Pawn('b', 'g7'), 'h7': new Pawn('b', 'h7'),
        };
        this.pieces = setup;
        this.renderPieces();
    },

    renderPieces() {
        // Clear all piece elements first
        document.querySelectorAll('.piece').forEach(p => p.remove());
        // Clear all quantum glows
        document.querySelectorAll('.quantum-state').forEach(q => q.remove());

        for (const pos in this.pieces) {
            const piece = this.pieces[pos];
            if (piece.inSuperposition) {
                // if it's in a quantum state, we draw two semi-transparent versions
                // and a glow effect.
                for (const qPos of piece.quantumPositions) {
                    const qSquare = this.squares[qPos];
                    const pieceDiv = this._createPieceElement(piece);
                    pieceDiv.style.opacity = '0.7';
                    qSquare.appendChild(pieceDiv);

                    const quantumGlow = document.createElement('div');
                    quantumGlow.className = 'quantum-state';
                    qSquare.appendChild(quantumGlow);
                }
            } else {
                // normal piece
                const square = this.squares[piece.position];
                square.appendChild(this._createPieceElement(piece));
            }
        }
    },
    
    // helper for creating the div
    _createPieceElement(piece) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = `piece ${piece.color}-${piece.type}`;
        pieceDiv.dataset.pieceId = piece.id;
        return pieceDiv;
    },

    // --- UTILITY FUNCTIONS ---
    
    getCoords(pos) {
        const col = this.cols.indexOf(pos[0]);
        const row = parseInt(pos[1], 10);
        return [col, row];
    },

    getPosition(col, row) {
        if (col < 0 || col > 7 || row < 1 || row > 8) {
            return null; // out of bounds
        }
        return `${this.cols[col]}${row}`;
    },
    
    getPiece(pos) {
        return this.pieces[pos] || null;
    },

    // These move calculation functions are helpers for the piece classes
    getStraightMoves(pos, color) {
        const moves = [];
        const [col, row] = this.getCoords(pos);
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dCol, dRow] of directions) {
            for (let i = 1; i < 8; i++) {
                const targetPos = this.getPosition(col + i * dCol, row + i * dRow);
                if (!targetPos) break;
                const targetPiece = this.getPiece(targetPos);
                if (targetPiece) {
                    if (targetPiece.color !== color) moves.push(targetPos);
                    break;
                }
                moves.push(targetPos);
            }
        }
        return moves;
    },

    getDiagonalMoves(pos, color) {
        const moves = [];
        const [col, row] = this.getCoords(pos);
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dCol, dRow] of directions) {
            for (let i = 1; i < 8; i++) {
                const targetPos = this.getPosition(col + i * dCol, row + i * dRow);
                if (!targetPos) break;
                const targetPiece = this.getPiece(targetPos);
                if (targetPiece) {
                    if (targetPiece.color !== color) moves.push(targetPos);
                    break;
                }
                moves.push(targetPos);
            }
        }
        return moves;
    }
};