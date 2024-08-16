socket.on('joinServer', (data) => {
    const POKER_ROOM = data.index;
    socket.serverIndex = data.index;

    lockFile.lock(lockFilePath2, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            socket.emit('error', 'Server error: Unable to acquire lock');
            return;
        }

        fs.readFile(jsonFilePath2, 'utf8', (err, fileData) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                socket.emit('error', 'Server error: Unable to read server data');
                lockFile.unlock(lockFilePath2, (unlockErr) => {
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
                    lockFile.unlock(lockFilePath2, (unlockErr) => {
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
                    lockFile.unlock(lockFilePath2, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                    return;
                }

                fs.writeFile(jsonFilePath2, JSON.stringify(jsonData, null, 2), (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to JSON file:', writeErr);
                    } else {
                        //socket.serverIndex = data.index; // Store the server index in the socket object
                        users.push([data.index, data.inputText, socket.id, data.player]);
                        socket.join(POKER_ROOM);
                        //////////////console.log(`Socket ${socket.id} joined room ${POKER_ROOM}`);
                        warcabyNamespace.to(POKER_ROOM).emit('joinedRoom', POKER_ROOM);
                    }

                    lockFile.unlock(lockFilePath2, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                    });
                });
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                socket.emit('error', 'Server error: Unable to parse server data');
                lockFile.unlock(lockFilePath2, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                });
            }
        });
    });
})