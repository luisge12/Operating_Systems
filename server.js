const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Sirve archivos estáticos en /public

// Variables para almacenar el estado del juego
let rooms = {};  // Objeto que mantiene las salas y su estado

// Cuando un cliente se conecta
io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);

    // Crear o unirse a una sala
    socket.on('join_room', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { board: Array(9).fill(null), players: [], turn: 'X' };
        }
        rooms[roomId].players.push(socket.id);
        socket.join(roomId);
        io.to(roomId).emit('room_update', rooms[roomId]);

        // Si la sala tiene 2 jugadores, iniciar partida
        if (rooms[roomId].players.length === 2) {
            io.to(roomId).emit('start_game', { turn: rooms[roomId].turn });
        }
    });

    // Manejar movimientos
    socket.on('make_move', (roomId, index) => {
        const room = rooms[roomId];
        // Verificar si el movimiento es válido
        if (room && room.board[index] === null && room.turn === (room.players[0] === socket.id ? 'X' : 'O')) {
            room.board[index] = room.turn;
            room.turn = room.turn === 'X' ? 'O' : 'X';
            io.to(roomId).emit('board_update', room.board);

            // Verificar si hay un ganador
            const winner = checkWinner(room.board);
            if (winner) {
                io.to(roomId).emit('game_over', { winner });
                delete rooms[roomId]; // Borrar la sala al finalizar la partida
            } 
            // Verificar si es empate
            else if (isBoardFull(room.board)) {
                io.to(roomId).emit('game_over', { winner: 'Empate' });
                delete rooms[roomId]; // Borrar la sala al finalizar la partida en caso de empate
            } 
            // Cambiar turno si no ha terminado
            else {
                io.to(roomId).emit('turn_change', room.turn);
            }
        }
    });

    // Al desconectar un jugador
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        for (const roomId in rooms) {
            if (rooms[roomId].players.includes(socket.id)) {
                delete rooms[roomId]; // Eliminar la sala si alguien se desconecta
                io.to(roomId).emit('game_over', { winner: 'Desconexión' });
            }
        }
    });
});

// Función para verificar si el tablero está lleno (empate)
function isBoardFull(board) {
    return board.every(cell => cell !== null);
}

// Función para verificar el ganador
function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Inicia el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
