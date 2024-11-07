const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Sirve archivos estáticos en /public

// Variables para almacenar el estado del juego
let rooms = {};  // Objeto que mantiene las salas y su estado
let roomCounter = 1;  // Contador para crear salas automáticamente

// Cuando un cliente se conecta
io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);

    // Asignar automáticamente a la primera sala disponible
    let roomId = Object.keys(rooms).find(id => rooms[id].players.length < 2);

    // Si no hay salas disponibles o están llenas, crea una nueva sala
    if (!roomId) {
        roomId = `room-${roomCounter++}`;
        rooms[roomId] = { board: Array(9).fill(null), players: [], turn: 'X' };
    }

    // Agrega al jugador a la sala
    rooms[roomId].players.push(socket.id);
    socket.join(roomId);
    socket.emit('room_assigned', roomId);
    console.log(`Jugador ${socket.id} se unió a ${roomId}`);

    // Si la sala tiene 2 jugadores, iniciar partida
    if (rooms[roomId].players.length === 2) {
        io.to(roomId).emit('start_game', { turn: rooms[roomId].turn });
    }

    // Manejar movimientos
    socket.on('make_move', (index) => {
        const room = rooms[roomId];
        if (room && room.board[index] === null && room.turn === (room.players[0] === socket.id ? 'X' : 'O')) {
            room.board[index] = room.turn;
            room.turn = room.turn === 'X' ? 'O' : 'X';
            io.to(roomId).emit('board_update', room.board);

            // Verificar ganador
            const winner = checkWinner(room.board);
            if (winner) {
                io.to(roomId).emit('game_over', { winner });
                delete rooms[roomId]; // Borrar la sala al finalizar la partida
            } else {
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
