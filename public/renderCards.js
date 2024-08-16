// Global Variables
//- var img = new Image(); 
//- img.src = "images/zolte kwiaty.jpeg";
const socket = io.connect('http://localhost:3000/poker');
let room;

let cardImagesClient = {};
let cardWidth = 50;
let cardHeight = 100;
let cardsPerPlayer = 5;
let numPlayersClient = 4;
let deckClient = [];
let handsClient = {};
let backImg;
let playerIndexClient = 0; // Global variable for player index
let users_no;
let players_no = 0;
let users_names = [];
let myName;
let startReq = false;
let myIndex;
let pokerPlayers = [];
socket.on('connect', () => {
    console.log('Connected to /warcaby namespace');
  
    // Retrieve the stored server data from local storage
    const serverData = JSON.parse(localStorage.getItem('serverData'));
    console.log(serverData);
    myName = serverData.inputText;
    if (serverData) {
        Player = serverData.player;
        playerName = serverData.inputText;
        console.log(Player);
        console.log(playerName);
  
        // Emit the joinServer event with the retrieved data
        socket.emit('joinServer', {
            inputText: serverData.inputText,
            index: serverData.index,
            players: serverData.players,
            player: serverData.player // Send player information
        });
  
        // Optionally, clear the data from local storage if it is no longer needed
        localStorage.removeItem('serverData');
    }
  });

socket.on('joinedRoom', (POKER_ROOM, USER_NAME, USER_NO) => {
    room = POKER_ROOM;
    users_no = USER_NO
    if(users_no > 1) document.getElementById('chip').textContent = 'CLICK TO START THE GAME'
    console.log(`Joined room: ${POKER_ROOM}`);
    socket.emit('im in', room, myName);
});
socket.on('user left', (name_left) => {
    console.log("left");
    const divs = document.querySelectorAll('.users');
    divs.forEach((div) => {
        if (div.textContent === name_left) {
                div.remove(); // Removes the div
        }
    });
    for(let i = 0; i < users_names.length; i++)
        if(name_left == users_names[i])
            users_names.splice(i, 1);
    users_no--;
    if(users_no == 1) document.getElementById('chip').textContent = 'WAIT FOR PLAYERS'    
});

socket.on('update poker players no', (newPlayersNo) => {
    players_no = newPlayersNo;
    console.log("new no", players_no);  
});
socket.on('send im in', (joinedName) => {
    // Check if the joinedName is already in the pokerPlayers array
    const playerExists = pokerPlayers.some(player => player.player === joinedName);

    // If the player does not exist and is not already in users_names, add them
    if (!playerExists && !users_names.includes(joinedName)) {
        users_names.push(joinedName);
        console.log("New player joined:", joinedName);
        $('#players').append(`<div class="users">${joinedName}</div>`);
    }
});

socket.on('poker room', (newRoom) => {
    players_no = newRoom.users.length;
    document.getElementById('buttonContainer').style.display = "none";
    document.getElementById('chip').textContent = 'WAIT FOR PLAYERS';
    $('#players').empty();
    pokerPlayers = [];
    for(let i = 0; i < newRoom.users.length; i++)
        if(newRoom.users[i].user == myName)
            myIndex = i;
        else {
            pokerPlayers.push({player: newRoom.users[i].user, index: i});
            $('#players').append(`<div class="users" value=${i}>${newRoom.users[i].user}</div>`);
        }
        console.log(myIndex, players_no, pokerPlayers);
        
});

socket.on('update poker players no', (update_room) => {
    if(update_room == 0) players_no = update_room;
    else players_no = update_room.users.length;
    $('#players').empty();
    pokerPlayers = [];
    if(update_room != 0) {
        for(let i = 0; i < update_room.users.length; i++)
            if(update_room.users[i].user == myName)
                myIndex = i;
            else {
                pokerPlayers.push({player: update_room.users[i].user, index: i});
                $('#players').append(`<div class="users" value=${i}>${update_room.users[i].user}</div>`);
            }
    }
        console.log(myIndex, players_no, pokerPlayers);
        
});

socket.on('restart', () => {
    document.getElementById('buttonContainer').style.display = "flex";
    startReq = false;
      
});
let mess = 'message from client';
console.log(room);

socket.on('start round', (hands) => {
    console.log(hands);
    //console.log(numPlayers);
    handsClient = hands;
    //numPlayersClient = numPlayers;
    preload();
    renderCards(); 
});

socket.on('send to opponent', (Mess) => {
    console.log(`send to opponent: ${Mess}`);
});

socket.on('send to room', (Mess) => {
    console.log(`send to opponent: ${Mess}`);
});

socket.on('privateMessage', (message) => {
    console.log(`privateMessage: ${message}`);
});

// Load images
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
            const filePath = `public/css/images/${name}_of_${suit}.svg`;
            cardImagesClient[filePath] = filePath; // Store the path
        }
    }
}

document.querySelectorAll('.card-container').forEach(cardContainer => {
    cardContainer.addEventListener('click', (event) => {
        const cardIndex = event.currentTarget.dataset.cardIndex;
        const playerIndexClient = event.currentTarget.closest('.player-row').dataset.playerIndexClient;
        const cardValue = handsClient[`Player ${playerIndexClient}`][cardIndex].value;

        console.log(`Row Index: ${playerIndexClient}, Card Index: ${cardIndex}, Card Value: ${cardValue}`);
    });
});

// function renderCards() {
//     const playersDiv = document.querySelector('.players');
//     playersDiv.innerHTML = ''; // Clear existing content

//     // Create divs for middle row and top row
//     const middleRowDiv = document.createElement('div');
//     middleRowDiv.id = 'middle-row';
//     const topRowDiv = document.createElement('div');
//     topRowDiv.id = 'top-row';

//     for (let i = 1; i <= numPlayersClient; i++) {
//         const hand = handsClient[`Player ${i}`];
//         const playerDiv = document.createElement('div');
//         const rowDiv = document.createElement('div');
//         playerDiv.className = 'player';
//         playerDiv.id = `player-${i}`; // Set ID based on player number
//         playerDiv.innerHTML = `<h3 class="names">Player ${i}</h3>`; // Add player title
//         rowDiv.className = 'player-row';
//         rowDiv.dataset.playerIndexClient = i; // Add data attribute for player index
//         rowDiv.addEventListener('click', () => {
//             rowDiv.classList.toggle('flipped');
//         });
//         let playerIndex = 0;
//         // Add cards to the row
//         hand.forEach((card, index) => {
//             // Container for the card (both front and back)
//             playerIndex = index;
//             const cardContainer = document.createElement('div');
//             cardContainer.className = 'card-container';
//             cardContainer.dataset.cardIndex = index; // Add data attribute for card index

//             // Create the back of the card
//             const back = document.createElement('div');
//             back.className = 'back';
//             const backImg = document.createElement('img');
//             backImg.className = 'card-img';
//             backImg.src = 'https://cdn.glitch.global/7bab3e73-57c9-4608-bf44-fb6dd416a372/back1.png?v=1722507954776';
//             back.appendChild(backImg);

//             // Create the front of the card
//             const front = document.createElement('div');
//             front.className = 'front';
//             const frontImg = document.createElement('img');
//             frontImg.className = 'card-img';
//             frontImg.src = cardImagesClient[card.filePath]; // Use a default image if filePath is not found
//             front.appendChild(frontImg);

//             // Container for both back and front
//             const backAndFront = document.createElement('div');
//             backAndFront.className = 'back-and-front';

//             // Append both back and front to the backAndFront container
//             backAndFront.appendChild(back);
//             backAndFront.appendChild(front);

//             // Append backAndFront to cardContainer
//             cardContainer.appendChild(backAndFront);

//             // Append cardContainer to the row
//             rowDiv.appendChild(cardContainer);
//         });

//         playerDiv.appendChild(rowDiv);

//         if (numPlayersClient === 4) {
//             if (i === 1) {
//                 // Player 1 at the bottom
//                 playersDiv.appendChild(playerDiv);
//             } else if (i === 2 || i === 3) {
//                 // Player 2 and Player 3 in the middle row
//                 middleRowDiv.appendChild(playerDiv);
//             } else if (i === 4) {
//                 // Player 4 at the top
//                 playersDiv.insertBefore(playerDiv, playersDiv.firstChild);
//             }
//         } else if (numPlayersClient === 3) {
//             if (i === 1) {
//                 // Player 1 at the bottom
//                 playersDiv.appendChild(playerDiv);
//             } else if (i === 2 || i === 3) {
//                 // Player 2 and Player 3 in the middle row above Player 1
//                 middleRowDiv.appendChild(playerDiv);
//             }
//         } else if (numPlayersClient === 2) {
//             if (i === 1) {
//                 // Player 1 at the bottom
//                 playersDiv.appendChild(playerDiv);
//             } else if (i === 2) {
//                 // Player 2 at the top
//                 playersDiv.insertBefore(playerDiv, playersDiv.firstChild);
//             }
//         }
//     }

//     // Append the middleRowDiv and topRowDiv to the main playersDiv, if there are players for those rows
//     if (numPlayersClient === 4) {
//         playersDiv.insertBefore(middleRowDiv, playersDiv.firstChild.nextSibling);
//     }

//     if (numPlayersClient === 3) {
//         playersDiv.insertBefore(middleRowDiv, playersDiv.firstChild);
//     }

//     adjustSize(); // Call adjustSize after rendering cards
// }

// function renderCards() {
//     const playersDiv = document.querySelector('.players');
//     playersDiv.innerHTML = ''; // Clear existing content

//     const middleRowDiv = document.createElement('div');
//     middleRowDiv.id = 'middle-row';
//     const topRowDiv = document.createElement('div');
//     topRowDiv.id = 'top-row';

//     for (let i = 1; i <= numPlayersClient; i++) {
//         const hand = handsClient[`Player ${i}`];
//         const playerDiv = document.createElement('div');
//         const rowDiv = document.createElement('div');
        
//         playerDiv.className = 'player';
//         playerDiv.id = `player-${i}`;
//         playerDiv.innerHTML = `<h3 class="names">Player ${i}</h3>`;
        
//         rowDiv.className = 'player-row';
//         rowDiv.dataset.playerIndexClient = i;
//         rowDiv.addEventListener('click', () => {
//             rowDiv.classList.toggle('flipped');
//         });

//         // Add cards to the row
//         hand.forEach((card, index) => {
//             const cardContainer = document.createElement('div');
//             cardContainer.className = 'card-container';
//             cardContainer.dataset.cardIndex = index; // Global index used here
            
//             const back = document.createElement('div');
//             back.className = 'back';
//             const backImg = document.createElement('img');
//             backImg.className = 'card-img';
//             backImg.src = 'https://cdn.glitch.global/7bab3e73-57c9-4608-bf44-fb6dd416a372/back1.png?v=1722507954776';
//             back.appendChild(backImg);

//             const front = document.createElement('div');
//             front.className = 'front';
//             const frontImg = document.createElement('img');
//             frontImg.className = 'card-img';
//             frontImg.src = cardImagesClient[card.filePath];
//             front.appendChild(frontImg);

//             const backAndFront = document.createElement('div');
//             backAndFront.className = 'back-and-front';
//             backAndFront.appendChild(back);
//             backAndFront.appendChild(front);

//             cardContainer.appendChild(backAndFront);
//             rowDiv.appendChild(cardContainer);
//         });

//         playerDiv.appendChild(rowDiv);

//         // Position players based on number of players
//         if (numPlayersClient === 4) {
//             if (i === 1) {
//                 playersDiv.appendChild(playerDiv); // Bottom
//             } else if (i === 2 || i === 3) {
//                 middleRowDiv.appendChild(playerDiv); // Middle
//             } else if (i === 4) {
//                 playersDiv.insertBefore(playerDiv, playersDiv.firstChild); // Top
//             }
//         } else if (numPlayersClient === 3) {
//             if (i === 1) {
//                 playersDiv.appendChild(playerDiv); // Bottom
//             } else if (i === 2 || i === 3) {
//                 middleRowDiv.appendChild(playerDiv); // Middle
//             }
//         } else if (numPlayersClient === 2) {
//             if (i === 1) {
//                 playersDiv.appendChild(playerDiv); // Bottom
//             } else if (i === 2) {
//                 playersDiv.insertBefore(playerDiv, playersDiv.firstChild); // Top
//             }
//         }
//     }

//     // Append the middleRowDiv and topRowDiv to the main playersDiv
//     if (numPlayersClient === 4) {
//         playersDiv.insertBefore(middleRowDiv, playersDiv.firstChild.nextSibling);
//     }

//     if (numPlayersClient === 3) {
//         playersDiv.insertBefore(middleRowDiv, playersDiv.firstChild);
//     }

//     adjustSize(); // Call adjustSize after rendering cards
// }

function renderCards() {
    const playersDiv = document.querySelector('.players');
    playersDiv.innerHTML = ''; // Clear existing content

    // Create divs for middle row and top row
    const middleRowDiv = document.createElement('div');
    middleRowDiv.id = 'middle-row';
    const topRowDiv = document.createElement('div');
    topRowDiv.id = 'top-row';

    let myPlayerDiv = null;
    const otherPlayerDivs = [];

    // Render cards for each player in pokerPlayers
    pokerPlayers.forEach(({ player, index }) => {
        const playerIndex = index + 1; // Convert 0-based index to 1-based
        const hand = handsClient[`Player ${playerIndex}`];

        if (!hand) {
            console.error(`No hand found for Player ${playerIndex}`);
            return; // Skip this player if their hand is undefined
        }

        const playerDiv = document.createElement('div');
        const rowDiv = document.createElement('div');
        
        playerDiv.className = 'player';
        playerDiv.id = `player-${playerIndex}`;
        playerDiv.innerHTML = `<h3 class="names">${player}</h3>`;
        
        rowDiv.className = 'player-row';
        rowDiv.dataset.playerIndexClient = playerIndex;
        rowDiv.addEventListener('click', () => {
            rowDiv.classList.toggle('flipped');
        });

        // Add cards to the row
        hand.forEach((card, cardIndex) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            cardContainer.dataset.cardIndex = cardIndex; // Store card index
            
            const back = document.createElement('div');
            back.className = 'back';
            const backImg = document.createElement('img');
            backImg.className = 'card-img';
            backImg.src = 'https://cdn.glitch.global/7bab3e73-57c9-4608-bf44-fb6dd416a372/back1.png?v=1722507954776';
            back.appendChild(backImg);

            const front = document.createElement('div');
            front.className = 'front';
            const frontImg = document.createElement('img');
            frontImg.className = 'card-img';
            frontImg.src = cardImagesClient[card.filePath];
            front.appendChild(frontImg);

            const backAndFront = document.createElement('div');
            backAndFront.className = 'back-and-front';
            backAndFront.appendChild(back);
            backAndFront.appendChild(front);

            cardContainer.appendChild(backAndFront);
            rowDiv.appendChild(cardContainer);
        });

        playerDiv.appendChild(rowDiv);

        // Compare with myIndex based on handsClient, not pokerPlayers
        if (playerIndex === myIndex + 1) { // Adjust for 1-based index
            myPlayerDiv = playerDiv;
        } else {
            otherPlayerDivs.push(playerDiv);
        }
    });

    // Determine where to place the players
    otherPlayerDivs.forEach(playerDiv => {
        const playerIndex = parseInt(playerDiv.id.split('-')[1], 10);
        
        if (players_no === 4) {
            if (playerIndex === 2 || playerIndex === 3) {
                middleRowDiv.appendChild(playerDiv); // Middle row players
            } else if (playerIndex === 4) {
                playersDiv.insertBefore(playerDiv, playersDiv.firstChild); // Top player
            }
        } else if (players_no === 3) {
            if (playerIndex === 2 || playerIndex === 3) {
                middleRowDiv.appendChild(playerDiv); // Middle row players
            }
        } else if (players_no === 2) {
            if (playerIndex === 2) {
                playersDiv.insertBefore(playerDiv, playersDiv.firstChild); // Top player
            }
        }
    });

    // Append my player's div at the bottom
    if (myPlayerDiv) {
        playersDiv.appendChild(myPlayerDiv);
    }

    // Insert middle row div where appropriate
    if (middleRowDiv.children.length > 0) { // Only insert if there are players in the middle row
        if (playersDiv.firstChild) {
            playersDiv.insertBefore(middleRowDiv, playersDiv.firstChild.nextSibling || playersDiv.firstChild);
        } else {
            playersDiv.appendChild(middleRowDiv);
        }
    }

    adjustSize(); // Call adjustSize after rendering cards
}



function adjustCardContainers() {
    console.log("adjust");
    const containers = document.querySelectorAll('.card-container');
    containers.forEach(container => {
        const img = container.querySelector('.card-img');
        if (img) {
            // Adjust container size based on image size
            container.style.width = `${img.offsetWidth}px`;
            container.style.height = `${img.offsetHeight}px`;
        }
    });

    // Make the elements visible after adjustment
    document.querySelectorAll('.card-container, .card-img, .names').forEach(element => {
        element.style.visibility = 'visible';
    });
}

function adjustSize() {
    const images = document.querySelectorAll('.card-img');
    console.log("size");

    // Initially hide elements
    images.forEach(img => img.style.visibility = 'hidden');
    document.querySelectorAll('.names').forEach(nameElement => nameElement.style.visibility = 'hidden');
    document.querySelectorAll('.card-container').forEach(container => container.style.visibility = 'hidden');

    if (images.length > 0) {
        // Get the computed width and height of the first image
        const imageWidth = images[0].clientWidth;
        const imageHeight = images[0].clientHeight;
        console.log(imageWidth);

        // Define the gap and margin proportions based on image size
        const gapProportion = 0.5; // 50% of image width for the gap
        const marginProportion = 0.7;
        const gap = imageWidth * gapProportion;

        // Adjust margins based on the number of players and image dimensions
        if (numPlayersClient === 4) {
            const player1 = document.getElementById('player-1');
            if (player1) {
                player1.style.marginBottom = `${marginProportion * imageHeight}px`;
            }
        } else if (numPlayersClient === 3) {
            const middleRow = document.getElementById('middle-row');
            if (middleRow) {
                middleRow.style.marginTop = `${marginProportion * imageHeight}px`;
            }
        } else if (numPlayersClient === 2) {
            const player2 = document.getElementById('player-2');
            if (player2) {
                player2.style.marginBottom = `${imageHeight}px`;
            }
        }

        // Adjust the gap between cards in each player row
        const playerRows = document.querySelectorAll('.player-row');
        playerRows.forEach(row => {
            row.style.gap = `${gap}px`;
        });
    }

    let loadedCount = 0;

    images.forEach((img) => {
        img.onload = () => {
            loadedCount++;
            if (loadedCount === images.length) {
                adjustCardContainers();
            }
        };
        // If the image is already loaded
        if (img.complete) {
            img.onload(); // Call the onload function directly
        }
    });

    // Call adjustCardContainers directly if images are already loaded
    if (loadedCount === images.length) {
        adjustCardContainers();
    }
}

// Debounce function to limit the rate at which adjustSize is called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Attach resize event listener with debounce
window.addEventListener('resize', debounce(() => {
    adjustSize();
}, 200));

function startGame() {
    socket.emit('start', room);
}
document.getElementById('chip').addEventListener('click', function() {
    if(users_no > 1 && !startReq) {
        socket.emit('start game', room, myName);
        startReq = true;
        document.getElementById('chip').textContent = "WAIT FOR ANOTHER PLAYER'S DECISION"
    }
});