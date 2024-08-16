const app = require('./app.js'); // Import the Express app
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const express = require('express');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const lockFile = require('lockfile');
const io = socketIo(server);
app.use('/public', express.static(path.join(__dirname, "public")));
// Namespace for /warcaby
const warcabyNamespace = io.of('/warcaby');
const pokerNamespace = io.of('/poker');

// Define the path to your JSON file
const jsonFilePath1 = path.join(__dirname, 'data', 'warcaby.json');
const lockFilePath1 = path.join(__dirname, 'data', 'warcaby.lock');
const jsonFilePath2 = path.join(__dirname, 'data', 'poker.json');
const lockFilePath2 = path.join(__dirname, 'data', 'poker.lock');

const users = [];
let BOARD;
let PAWNS;
let TURN;
let CHECK;
let PLAY;
let KILL;
let KILLER_MODE;
let KILLED2;
let KILLED_MODE;
let PLAYERS = [];

//io.sockets.emit('new state', BOARD, PAWNS, TURN, PLAY, CHECK, KILL);
//io.to(USERS[0][1]).emit('chat', MESS, USER)
warcabyNamespace.on('connection', (socket) => {
    //////////////console.log('We have a new client in /warcaby: ' + socket.id);

    // Track the server the client joined
    socket.on('joinServer', (data) => {
        const ROOM = `room_${data.index}`;
        socket.serverIndex = data.index;

        lockFile.lock(lockFilePath1, { wait: 5000 }, (lockErr) => {
            if (lockErr) {
                console.error('Error acquiring lock:', lockErr);
                socket.emit('error', 'Server error: Unable to acquire lock');
                return;
            }

            fs.readFile(jsonFilePath1, 'utf8', (err, fileData) => {
                if (err) {
                    console.error('Error reading JSON file:', err);
                    socket.emit('error', 'Server error: Unable to read server data');
                    lockFile.unlock(lockFilePath1, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                    return;
                }

                try {
                    let jsonData = JSON.parse(fileData);
                    const server = jsonData[data.index];

                    if (!server) {
                        socket.emit('error', 'Invalid server index');
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    if (data.player === 1) {
                        server.block = 0; // Unblock for user2
                        server.user1 = data.inputText;
                    } else if (data.player === 2) {
                        server.user2 = data.inputText;
                    } else {
                        socket.disconnect(true);
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    fs.writeFile(jsonFilePath1, JSON.stringify(jsonData, null, 2), (writeErr) => {
                        if (writeErr) {
                            console.error('Error writing to JSON file:', writeErr);
                        } else {
                            //socket.serverIndex = data.index; // Store the server index in the socket object
                            users.push([data.index, data.inputText, socket.id, data.player]);
                            socket.join(ROOM);
                            //////////////console.log(`Socket ${socket.id} joined room ${ROOM}`);
                            warcabyNamespace.to(ROOM).emit('joinedRoom', ROOM);
                        }

                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                    });
                } catch (err) {
                    console.error('Error parsing JSON data:', err);
                    socket.emit('error', 'Server error: Unable to parse server data');
                    lockFile.unlock(lockFilePath1, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                }
            });
        });
    })
    socket.on('send2', (message, room) => {
        const MESS = message; 
        warcabyNamespace.to(room).emit('send to room', MESS);
    });
    socket.on('send1', (message, room) => {
        const MESS = message;

        socket.broadcast.to(room).emit('send to opponent', MESS);
    });
    socket.on('turn', function(Greenturn, check, room) {
        if (!check) TURN = !Greenturn;
        else TURN = Greenturn;
        //console.log('TURN', TURN);
        //console.log('check', check);
        warcabyNamespace.to(room).emit('new turn', TURN);
    });
    socket.on('state', function(Board, serializedPawns, Greenturn, check, current, room) {

        BOARD = Board;
        PAWNS = serializedPawns;
        ////////////console.log(check);
        // if (!check) TURN = !Greenturn;
        // else TURN = Greenturn;
        //TURN = !Greenturn;
        //CHECK = check;
        PLAY = current;
        //KILL = killConditionsUnique;
        ////////////////console.log("state " + TURN);
        socket.broadcast.to(room).emit('new state', BOARD, PAWNS, PLAY);

      });
    
      socket.on('move', function(targetPos, room, animatedPawn) {
        // Constructing the new position object
        let newPos = { 
          x: targetPos.x, 
          y: targetPos.y, 
          oldX: targetPos.oldX, 
          oldY: targetPos.oldY 
          // Include looserIndex if needed, for example:
          // looserIndex: targetPos.looserIndex 
        };
        let PAWN = animatedPawn
      
        // Broadcasting 'animate' event to all clients in the specified room
        socket.broadcast.to(room).emit('animate', newPos, PAWN);
      });
    
      socket.on('multikill', function(killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room) {
        KILLER_MODE = killersOptMode;
        KILLED_MODE = killedOptMode;
        KILLED2 = oneKiller2Killed;
        PAWNS = Pawns;
        warcabyNamespace.to(room).emit('update multikill', KILLER_MODE, KILLED_MODE, KILLED2, PAWNS);  
      });
    //   socket.on('killedOptMode mode', function(killersOptMode, killedOptMode, oneKiller2Killed, Pawns, room) {
    //     KILLER_MODE = killersOptMode;
    //     KILLED_MODE = killedOptMode;
    //     KILLED2 = oneKiller2Killed;
    //     PAWNS = Pawns;
    //     warcabyNamespace.to(room).emit('update killedOptMode mode', KILLER_MODE, KILLED_MODE, KILLED2, PAWNS);  
    //   });
    //   socket.on('oneKiller2Killed mode mode', function(oneKiller2Killed, Pawns, room) {
    //     KILLED2 = oneKiller2Killed;
    //     PAWNS = Pawns;
    //     warcabyNamespace.to(room).emit('update kille1killed2 mode', KILLED2, PAWNS);  
    //   });
    
      socket.on('complete', function(Player, room) {
        PLAYERS.push([Player, room]);
        ////console.log('complete', Player, room);
        for (let i = 0; i < PLAYERS.length; i++) {
            for (let j = i + 1; j < PLAYERS.length; j++) {
                if (((PLAYERS[i][0] == 1 && PLAYERS[j][0] == 2) || (PLAYERS[i][0] == 2 && PLAYERS[j][0] == 1)) &&
                    PLAYERS[i][1] == room && PLAYERS[j][1] == room) {
                    
                    warcabyNamespace.to(PLAYERS[j][1]).emit('both completed');
                    
                    console.log('condition');
                    console.log(PLAYERS[i]);
                    console.log(PLAYERS[j]);
        
                    // Splice the higher index first
                    PLAYERS.splice(j, 1);
                    PLAYERS.splice(i, 1);
        
                    //////////console.log('before //////////console PLAYERS');
                    //////////console.log(PLAYERS);
                    //////////console.log('after //////////console PLAYERS');
                    
                    // Decrement the index to adjust for the removed element
                    i--;
                    break; // Break to restart the outer loop since the array has changed
                }
            }
        }
        console.log(PLAYERS);
        
      });
      socket.on('message kill', function(message, played, pawnLetter, pawnNumber, pawnLetterLooser, pawnNumberLooser, room) {
        let MES = message;
        let PLAYED = played;
        
        let LETTER = pawnLetter;
        let NUMBER = pawnNumber;
        let LETTER_LOOSER = pawnLetterLooser;
        let NUMBER_LOOSER = pawnNumberLooser;
        warcabyNamespace.to(room).emit('update message kill', MES, PLAYED, LETTER, NUMBER, LETTER_LOOSER, NUMBER_LOOSER);  
      });
      socket.on('blockKill false', function(blockKill, blockKillPawn, releaseBlock, killmode, room) {
        let BLOCK_KILL = blockKill;
        let BLOCK_KILL_PAWN = blockKillPawn;
        let RELEASE_BLOCK = releaseBlock;
        let KILL_MODE = killmode;
        
        socket.broadcast.to(room).emit('update blockKill false', BLOCK_KILL, BLOCK_KILL_PAWN, RELEASE_BLOCK, KILL_MODE);  
      });
      socket.on('message move', function(message, played, pawnLetter, pawnNumber, boardLetter, boardNumber, room) {
        let MES = message;
        let PLAYED = played;
        
        let LETTER = pawnLetter;
        let NUMBER = pawnNumber;
        let LETTER_BOARD = boardLetter;
        let NUMBER_BOARD = boardNumber;
        warcabyNamespace.to(room).emit('update message move', MES, PLAYED, LETTER, NUMBER, LETTER_BOARD, NUMBER_BOARD);  
      });
      socket.on('send message', function(inputValString, room, Player) {
        let MESS = inputValString;
        let SENDER = Player;
        //////////////console.log("chat");
        socket.broadcast.to(room).emit('chat', MESS, SENDER);
        
      });
      

    // Handle client disconnection
    socket.on('disconnect', () => {
        

                fs.readFile(jsonFilePath1, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading JSON file:', err);
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    try {
                        let jsonData = JSON.parse(fileData);

                        if (jsonData[socket.serverIndex]) {
                            jsonData[socket.serverIndex].players = Math.max(0, jsonData[socket.serverIndex].players - 1);
                            console.log(jsonData[socket.serverIndex].players);
                            for (let i = 0; i < users.length; i++) {
                                if (socket.id === users[i][2] && jsonData[users[i][0]].user1 === users[i][1]) {
                                    jsonData[users[i][0]].user1 = '';
                                    //jsonData[users[i][0]].players--;
                                } else if (socket.id === users[i][2] && jsonData[users[i][0]].user2 === users[i][1]) {
                                    jsonData[users[i][0]].user2 = '';
                                    //jsonData[users[i][0]].players--;
                                } 

                                if (socket.id === users[i][2] && jsonData[socket.serverIndex].players == 0)
                                    jsonData[users[i][0]].block = 1;  

                            }

                            fs.writeFile(jsonFilePath1, JSON.stringify(jsonData, null, 2), (writeErr) => {
                                if (writeErr) {
                                    console.error('Error writing to JSON file:', writeErr);
                                } else {
                                    console.log('JSON file updated successfully after disconnection');
                                }

                                lockFile.unlock(lockFilePath1, (unlockErr) => {
                                    if (unlockErr) {
                                        console.error('Error releasing lock:', unlockErr);
                                    }
                                });
                                
                            });
                        } else {
                            lockFile.unlock(lockFilePath1, (unlockErr) => {
                                if (unlockErr) {
                                    console.error('Error releasing lock:', unlockErr);
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing JSON data:', err);
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                    }
                });
            });
        
    
});

//poker

const cardImages = {};

const cardsPerPlayer = 5;
const numPlayers = 4;
const deck = [];
let hands = {};
let playerIndex = 0;
const pokerUsers = [];
const pokerRooms = [];

function pokerRoom(index, users, full, id, deck) {
    this.index = index;
    this.users = users || [];
    this.full = full || false;
    this.id = id || null;
    this.deck = deck || [];
}

// pokerNamespace.on('connection',
//     // We are given a websocket object in our function
//         function (socket) {
//             const Room = 'test room';
//             let message = 'private';
//             console.log("We have a new client: " + socket.id);
//             socket.join(Room);
//             pokerNamespace.to(Room).emit('joinedRoom', Room);
//             // io.to(socket.id).emit('privateMessage', message);
//             // socket.on('test', function(mess, room) {
//             //     let Mess = mess;
//             //     let messFromRoom = room;
//             //     console.log(Mess, messFromRoom)
//             //     io.to(messFromRoom).emit('send to room', Mess);
                
//             // });
//             // socket.on('test2', function(mess, room) {
//             //     let Mess = mess;
//             //     let messFromRoom = room;
//             //     console.log(Mess, messFromRoom)
                
//             //     socket.broadcast.to(messFromRoom).emit('send to opponent', Mess);    
//             // });
//             socket.on('start', function(room) {
//                 const messFromRoom = room; 
//                 setup();
//                 pokerNamespace.to(messFromRoom).emit('start round', hands, numPlayers);
//             });
//             socket.on('disconnect', function() {
//                 console.log("Client has disconnected");
//             });
            
//         }
//     );

//poker

pokerNamespace.on('connection', (socket) => {
    //////////////console.log('We have a new client in /warcaby: ' + socket.id);

    // Track the server the client joined
    socket.on('joinServer', (data) => {
        const POKER_ROOM = data.index;
        const USER_NAME = data.inputText;
        const USER_NO = data.players;
        socket.serverIndex = data.index;
        console.log("poker room:", POKER_ROOM)
        fs.readFile(jsonFilePath2, 'utf8', (err, fileData) => {
                
            let jsonData = JSON.parse(fileData);
            const server = jsonData[data.index];
            console.log("try", server)
            socket.serverIndex = data.index; // Store the server index in the socket object
            pokerUsers.push({index: data.index, user: data.inputText, id: socket.id, full: data.full});
            socket.join(POKER_ROOM);
            console.log(`Socket ${socket.id} joined room ${POKER_ROOM}`);
            pokerNamespace.to(POKER_ROOM).emit('joinedRoom', POKER_ROOM, USER_NAME, USER_NO);
            
               
            });
        });
    
        function userExistsInAnyRoom(userId) {
            return pokerRooms.some(room => room.users.some(user => user.id === userId));
        }
        
        // Function to check if a user exists in a specific room by ID
        function userExistsInRoom(room, userId) {
            return room.users.some(user => user.id === userId);
        }
        
        // Function to automatically add the third user if available
        function addThirdUserToRoom(room) {
            // Find the next available user who can be added
            const thirdUser = pokerUsers.find(user => user.index === room.index && !userExistsInAnyRoom(user.id));
        
            if (thirdUser) {
                if (!userExistsInRoom(room, thirdUser.id)) {
                    room.users.push({ user: thirdUser.user, id: thirdUser.id });
                    console.log(`Automatically added user ${thirdUser.user} (ID: ${thirdUser.id}) to room index ${room.index}`);
                } else {
                    console.log(`User ${thirdUser.user} (ID: ${thirdUser.id}) is already in room index ${room.index}`);
                }
            } else {
                console.log(`No available third user to add to room index ${room.index}`);
            }
        }
        
        // Define the socket event handler
        socket.on('start game', (room, myName) => {
            // Find the room index or create a new room if it doesn't exist
            const roomIndex = pokerRooms.findIndex(array => array.index === room);
        
            // Check if the room exists
            if (roomIndex === -1) {
                // Create a new room using the pokerRoom constructor
                const newRoom = new pokerRoom(room);
                pokerRooms.push(newRoom);
                console.log(`Created new room with index ${room}`);
            }
        
            // Find the room object
            const roomObj = pokerRooms.find(array => array.index === room);
        
            if (roomObj) {
                // Check if the user already exists in any room
                if (!userExistsInAnyRoom(socket.id)) {
                    // Check if the user already exists in the specific room
                    if (!userExistsInRoom(roomObj, socket.id)) {
                        // Add the user to the room if they do not already exist
                        roomObj.users.push({ user: myName, id: socket.id });
                        console.log(`Added user ${myName} (ID: ${socket.id}) to room index ${room}`);
        
                        // Automatically add the third user if there are already 2 users in the room
                        if (roomObj.users.length === 2) {
                            addThirdUserToRoom(roomObj);
                        }
                    } else {
                        console.log(`User ${myName} (ID: ${socket.id}) already exists in room index ${room}`);
                    }
                } else {
                    console.log(`User ${myName} (ID: ${socket.id}) already exists in one of the rooms.`);
                }
            } else {
                console.log(`No room found with index ${room}`);
            }
        
            // Log the final state of pokerRooms
            console.log('Final state of pokerRooms:');
            pokerRooms.forEach(rm => {
                console.log(`Room index ${rm.index}:`);
                rm.users.forEach(user => {
                    console.log(` - User ${user.user} (ID: ${user.id})`);
                });
            });
            console.log("pokerRooms", pokerRooms);
            console.log("users", roomObj.users);
        });
    // Handle client disconnection
    socket.on('disconnect', () => {
       

                fs.readFile(jsonFilePath2, 'utf8', (err, fileData) => {
                    if (err) {
                        console.error('Error reading JSON file:', err);
                        lockFile.unlock(lockFilePath2, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                        return;
                    }

                    try {
                        let jsonData = JSON.parse(fileData);

                        if (jsonData[socket.serverIndex]) {
                            jsonData[socket.serverIndex].players = Math.max(0, jsonData[socket.serverIndex].players - 1);
                            console.log(jsonData[socket.serverIndex].players);
                            for (let i = 0; i < pokerUsers.length; i++) {
                                if (socket.id === pokerUsers[i][2] && jsonData[pokerUsers[i][0]].user1 === pokerUsers[i][1]) {
                                    jsonData[pokerUsers[i][0]].user1 = '';
                                    //jsonData[pokerUsers[i][0]].players--;
                                } else if (socket.id === pokerUsers[i][2] && jsonData[pokerUsers[i][0]].user2 === pokerUsers[i][1]) {
                                    jsonData[pokerUsers[i][0]].user2 = '';
                                    //jsonData[pokerUsers[i][0]].players--;
                                } 

                                if (socket.id === pokerUsers[i][2] && jsonData[socket.serverIndex].players == 0)
                                    jsonData[pokerUsers[i][0]].block = 1;  

                            }

                            fs.writeFile(jsonFilePath2, JSON.stringify(jsonData, null, 2), (writeErr) => {
                                if (writeErr) {
                                    console.error('Error writing to JSON file:', writeErr);
                                } else {
                                    console.log('JSON file updated successfully after disconnection');
                                }

                                lockFile.unlock(lockFilePath2, (unlockErr) => {
                                    if (unlockErr) {
                                        console.error('Error releasing lock:', unlockErr);
                                    }
                                });
                                
                            });
                        } else {
                            lockFile.unlock(lockFilePath2, (unlockErr) => {
                                if (unlockErr) {
                                    console.error('Error releasing lock:', unlockErr);
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Error parsing JSON data:', err);
                        lockFile.unlock(lockFilePath2, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                        });
                    }
                });
            });
        
    });


server.listen(port, () => {
    //////////////console.log(`Server is running on port ${port}`);
});
function preload() {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = [
        { value: 2, name: '2' }, { value: 3, name: '3' }, { value: 4, name: '4' },
        { value: 5, name: '5' }, { value: 6, name: '6' }, { value: 7, name: '7' },
        { value: 8, name: '8' }, { value: 9, name: '9' }, { value: 10, name: '10' },
        { value: 11, name: 'jack' }, { value: 12, name: 'queen' }, { value: 13, name: 'king' },
        { value: 14, name: 'ace' }
    ];

    for (let suit of suits) {
        for (let { value, name } of values) {
            const filePath = `svg/${name}_of_${suit}.svg`;
            cardImages[filePath] = filePath; // Store the path
        }
    }
}

function setup() {
    preload(); // Load images

    // Generate and shuffle the deck
    deck.push(...generateDeck());
    shuffleDeck(deck);

    // Deal cards to players
    dealCards(numPlayers);

    // Render cards to the DOM
    //renderCards();

    // Add click event listeners to cards after rendering
    

    // Evaluate hands and log to console
    evaluateHands();
}

function generateDeck() {
    const deck = [];
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = [
        { value: 2, name: '2' }, { value: 3, name: '3' }, { value: 4, name: '4' },
        { value: 5, name: '5' }, { value: 6, name: '6' }, { value: 7, name: '7' },
        { value: 8, name: '8' }, { value: 9, name: '9' }, { value: 10, name: '10' },
        { value: 11, name: 'jack' }, { value: 12, name: 'queen' }, { value: 13, name: 'king' },
        { value: 14, name: 'ace' }
    ];

    for (let suit of suits) {
        for (let { value, name } of values) {
            const filePath = `public/css/images/${name}_of_${suit}.svg`;
            deck.push({ value, suit, name, filePath });
        }
    }

    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards(numPlayers) {
    hands = {};
    for (let i = 0; i < numPlayers; i++) {
        hands[`Player ${i + 1}`] = [];
    }

    for (let i = 0; i < numPlayers * cardsPerPlayer; i++) {
        let playerIndex = i % numPlayers;
        hands[`Player ${playerIndex + 1}`].push(deck.pop());
    }
}

function evaluateHands() {
    for (let player in hands) {
        const hand = hands[player];
        const handRank = determineHandRank(hand);
        console.log(`${player} has ${handRank}`);
    }
}

function determineHandRank(hand) {
    const suits = hand.map(card => card.suit);
    const values = hand.map(card => card.value).sort((a, b) => a - b);

    const isFlush = new Set(suits).size === 1;
    const isStraight = values.every((val, index) => index === 0 || val === values[index - 1] + 1);
    const valueCounts = values.reduce((acc, val) => (acc[val] = (acc[val] || 0) + 1, acc), {});
    const counts = Object.values(valueCounts).sort((a, b) => b - a);

    if (isFlush && isStraight && values[0] === 10) return 'Royal Flush';
    if (isFlush && isStraight) return 'Straight Flush';
    if (counts[0] === 4) return 'Four of a Kind';
    if (counts[0] === 3 && counts[1] === 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (counts[0] === 3) return 'Three of a Kind';
    if (counts[0] === 2 && counts[1] === 2) return 'Two Pair';
    if (counts[0] === 2) return 'One Pair';
    return 'High Card';
}