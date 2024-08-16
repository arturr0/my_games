const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const lockFile = require('lockfile');

// Define the path to your JSON file
const jsonFilePath1 = path.join(__dirname, '..', 'data', 'warcaby.json');
const lockFilePath1 = path.join(__dirname, '..', 'data', 'warcaby.lock');
const jsonFilePath2 = path.join(__dirname, '..', 'data', 'poker.json');
const lockFilePath2 = path.join(__dirname, '..', 'data', 'poker.lock');

router.get('/', (req, res) => {
    res.render('home', { title: 'My HTML Page' });
});

router.get('/servers-dataWarcaby', (req, res) => {
    fs.readFile(jsonFilePath1, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return res.status(500).send('Server error');
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData); // Send JSON data to client
        } catch (err) {
            console.error('Error parsing JSON data:', err);
            return res.status(500).send('Server error');
        }
    });
});
router.get('/findWarcaby', (req, res) => {
    fs.readFile(jsonFilePath1, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return res.status(500).send('Server error');
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData); // Send JSON data to client
        } catch (err) {
            console.error('Error parsing JSON data:', err);
            return res.status(500).send('Server error');
        }
    });
});

router.post('/create-serverWarcaby', (req, res) => {
    lockFile.lock(lockFilePath1, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            return res.status(500).send('Server error');
        }

        fs.readFile(jsonFilePath1, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                lockFile.unlock(lockFilePath1, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const newServerIndex = jsonData.length;
                const newServer = { index: newServerIndex, players: 0, user1: "", user2: "", block: 1 };
                jsonData.push(newServer);

                fs.writeFile(jsonFilePath1, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to JSON file:', writeErr);
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                            return res.status(500).send('Server error');
                        });
                        return;
                    }

                    // Force sync to disk
                    const fd = fs.openSync(jsonFilePath1, 'r+');
                    fs.fsyncSync(fd);
                    fs.closeSync(fd);

                    console.log('Server created:', newServer);

                    lockFile.unlock(lockFilePath1, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        res.json(newServer);
                    });
                });
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                lockFile.unlock(lockFilePath1, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
            }
        });
    });
});

router.post('/submitWarcaby', (req, res) => {
    const { inputText, index } = req.body;

    lockFile.lock(lockFilePath1, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            return res.status(500).send('Server error');
        }

        fs.readFile(jsonFilePath1, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                lockFile.unlock(lockFilePath1, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const server = jsonData[index];

                if (!server) {
                    lockFile.unlock(lockFilePath1, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        return res.status(400).send('Invalid server index');
                    });
                    return;
                }

                let player = 0;

                if (server.user1 === "") {
                    server.user1 = inputText;
                    server.players++;
                    player = 1;
                    //server.block = 0; // Allow user2 to connect
                    console.log(`User1 connected: ${inputText}`);
                } else if (server.user2 === "" && server.block == 0) {
                    server.user2 = inputText;
                    server.players++;
                    player = 2;
                    console.log(`User2 connected: ${inputText}`);
                    console.log(server);
                } else {
                    lockFile.unlock(lockFilePath1, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        return res.status(400).send('Server is full or blocked');
                    });
                    return;
                }

                fs.writeFile(jsonFilePath1, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to JSON file:', writeErr);
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                            return res.status(500).send('Server error');
                        });
                        return;
                    }
                
                    // Force sync to disk
                    const fd = fs.openSync(jsonFilePath1, 'r+');
                    fs.fsyncSync(fd);
                    fs.closeSync(fd);
                
                    console.log(`Updated JSON for server ${index}:`, jsonData[index]);
                
                    lockFile.unlock(lockFilePath1, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        res.json({ index, players: server.players, player });
                    });
                });
                
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                lockFile.unlock(lockFilePath1, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
            }
        });
    });
});
//poker
router.get('/servers-dataPoker', (req, res) => {
    fs.readFile(jsonFilePath2, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return res.status(500).send('Server error');
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData); // Send JSON data to client
        } catch (err) {
            console.error('Error parsing JSON data:', err);
            return res.status(500).send('Server error');
        }
    });
});
router.get('/findPoker', (req, res) => {
    fs.readFile(jsonFilePath2, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return res.status(500).send('Server error');
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData); // Send JSON data to client
        } catch (err) {
            console.error('Error parsing JSON data:', err);
            return res.status(500).send('Server error');
        }
    });
});

router.post('/create-serverPoker', (req, res) => {
    lockFile.lock(lockFilePath2, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            return res.status(500).send('Server error');
        }

        fs.readFile(jsonFilePath2, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                lockFile.unlock(lockFilePath2, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const newServerIndex = jsonData.length;
                const newServer = { index: newServerIndex, players: 0, user1: "", user2: "", user3: "", user4: "", full: 0 };
                jsonData.push(newServer);

                fs.writeFile(jsonFilePath2, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to JSON file:', writeErr);
                        lockFile.unlock(lockFilePath1, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                            return res.status(500).send('Server error');
                        });
                        return;
                    }

                    // Force sync to disk
                    const fd = fs.openSync(jsonFilePath2, 'r+');
                    fs.fsyncSync(fd);
                    fs.closeSync(fd);

                    console.log('Server created:', newServer);

                    lockFile.unlock(lockFilePath2, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        res.json(newServer);
                    });
                });
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                lockFile.unlock(lockFilePath2, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
            }
        });
    });
});

router.post('/submitPoker', (req, res) => {
    const { inputText, index } = req.body;

    lockFile.lock(lockFilePath2, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            return res.status(500).send('Server error');
        }

        fs.readFile(jsonFilePath2, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                lockFile.unlock(lockFilePath2, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const server = jsonData[index];

                if (!server) {
                    lockFile.unlock(lockFilePath2, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        return res.status(400).send('Invalid server index');
                    });
                    return;
                }

                // Find the next available user slot
                let playerSlot = null;
                if (!server.user1) {
                    server.user1 = inputText;
                    playerSlot = 1;
                } else if (!server.user2) {
                    server.user2 = inputText;
                    playerSlot = 2;
                } else if (!server.user3) {
                    server.user3 = inputText;
                    playerSlot = 3;
                } else if (!server.user4) {
                    server.user4 = inputText;
                    playerSlot = 4;
                }

                if (playerSlot !== null) {
                    server.players++;

                    fs.writeFile(jsonFilePath2, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                        if (writeErr) {
                            console.error('Error writing to JSON file:', writeErr);
                            lockFile.unlock(lockFilePath2, (unlockErr) => {
                                if (unlockErr) {
                                    console.error('Error releasing lock:', unlockErr);
                                }
                                return res.status(500).send('Server error');
                            });
                            return;
                        }

                        // Force sync to disk
                        const fd = fs.openSync(jsonFilePath2, 'r+');
                        fs.fsyncSync(fd);
                        fs.closeSync(fd);

                        console.log(`Updated JSON for server ${index}:`, jsonData[index]);

                        lockFile.unlock(lockFilePath2, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                            res.json({ index, players: server.players, playerSlot });
                        });
                    });
                } else {
                    lockFile.unlock(lockFilePath2, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        return res.status(400).send('Server is full or blocked');
                    });
                }
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                lockFile.unlock(lockFilePath2, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
            }
        });
    });
});


module.exports = router;
