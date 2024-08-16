// function find4players(pokerUsers) {
//     const indexGroups = {}; // Object to store grouped indexes
//     const result = []; // Array to store the result groups

//     // Step 1: Group objects by their index values
//     pokerUsers.forEach((user, i) => {
//         if (!indexGroups[user.index]) {
//             indexGroups[user.index] = [];
//         }
//         indexGroups[user.index].push(i);
//     });

//     console.log('Grouped Indexes:', indexGroups); // Debugging line

//     // Step 2: Identify groups with exactly four objects
//     for (let index in indexGroups) {
//         if (indexGroups[index].length === 4) {
//             result.push(indexGroups[index]); // Add the group of indexes to result array
//         }
//     }

//     return result;
// }

// // Example usage:
// const pokerUsers = [
//     { index: 1, user: 'User1', id: 'id1', full: false },
//     { index: 2, user: 'User2', id: 'id2', full: false },
//     { index: 1, user: 'User3', id: 'id3', full: false },
//     { index: 1, user: 'User4', id: 'id4', full: false },
//     { index: 2, user: 'User6', id: 'id6', full: false },
//     { index: 2, user: 'User6', id: 'id6', full: false },
//     { index: 2, user: 'User6', id: 'id6', full: false },
//     { index: 3, user: 'User7', id: 'id7', full: false },
//     { index: 1, user: 'User8', id: 'id8', full: false },
//     { index: 5, user: 'User8', id: 'id8', full: false }
// ];

// // Find original indexes where there are exactly 4 objects with the same index
// const result = find4players(pokerUsers);

// console.log('Result:', result); 
// // Expected Output: [[0, 2, 3, 8], [1, 4, 5, 6]]

function find4players(pokerUsers) {
    const indexGroups = {}; // Object to store grouped indexes
    const result = []; // Array to store the result groups

    // Step 1: Group objects by their index values
    pokerUsers.forEach((user, i) => {
        if (!indexGroups[user.index]) {
            indexGroups[user.index] = [];
        }
        indexGroups[user.index].push(i);
    });

    console.log('Grouped Indexes:', indexGroups); // Debugging line

    // Step 2: Identify groups with exactly four objects and include the index
    for (let index in indexGroups) {
        if (indexGroups[index].length === 4) {
            result.push({ index: Number(index), positions: indexGroups[index] }); // Add the index and group of positions to the result array
        }
    }

    return result;
}

// Example usage:
const pokerUsers = [
    //{ index: 1, user: 'User1', id: 'id1', full: false },
    { index: 2, user: 'User2', id: 'id2', full: false },
    { index: 1, user: 'User3', id: 'id3', full: false },
    { index: 1, user: 'User4', id: 'id4', full: false },
    { index: 2, user: 'User6', id: 'id6', full: false },
    { index: 2, user: 'User6', id: 'id6', full: false },
    { index: 2, user: 'User6', id: 'id6', full: false },
    { index: 3, user: 'User7', id: 'id7', full: false },
    { index: 1, user: 'User8', id: 'id8', full: false },
    { index: 5, user: 'User8', id: 'id8', full: false }
];

// Find original indexes where there are exactly 4 objects with the same index
const result = find4players(pokerUsers);

console.log('Result:', result); 
// Expected Output: [{ index: 1, positions: [0, 2, 3, 8] }]
