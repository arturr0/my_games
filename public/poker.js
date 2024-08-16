$(document).ready(function() {
    let find = false;
    let currentScrollIndex = 0;
    let scroll = false;
    let rowsToScroll = [];
    let playerName = "";

    // Function to highlight rows where players === 1
    function highlightUserRow(jsonData) {
        if (scroll) rowsToScroll = [];
        $('#serversTablePoker tbody tr').each(function(index) {
            const $row = $(this);
            const serverIndex = $row.find('.button_spin').data('index');

            // Check if player at current index in jsonData has players === 1
            if ((jsonData[serverIndex] && jsonData[serverIndex].players === 1 && playerName == "") ||
                (jsonData[serverIndex] && jsonData[serverIndex].players === 1 && 
                (jsonData[serverIndex].user1 == playerName || jsonData[serverIndex].user2 == playerName)
                )) {
                $row.find('.joinPoker').addClass('green-border');
                if (scroll) rowsToScroll.push($row); // Collect row element with green border
            } else {
                $row.find('.joinPoker').removeClass('green-border');
            }
        });
    }

    // Function to scroll to the next row with green border
    function scrollToNextRow() {
        if (currentScrollIndex >= rowsToScroll.length) {
            currentScrollIndex = 0;
        }

        const $nextRow = rowsToScroll[currentScrollIndex];
        const containerScrollTop = $('#poker-table-container').scrollTop();
        const containerHeight = $('#poker-table-container').height();
        const rowOffsetTop = $nextRow.offset().top - $('#serversTablePoker').offset().top;
        const rowHeight = $nextRow.outerHeight();

        const scrollTo = rowOffsetTop - (containerHeight / 2) + (rowHeight / 2);

        $('#poker-table-container').animate({
            scrollTop: scrollTo
        }, 500);

        currentScrollIndex++;
    }

    $('#createServerPoker').on('click', function() {
        $.post('/create-serverPoker')
            .done(function(data) {
                $('tbody#pokerTbody').append(`
                    <tr id="server-${data.index}">
                        <td class="server">SERVER ${data.index + 1}</td>
                        <td class="button_spin" data-index="${data.index}" data-players="${data.players}">
                            <button class="joinPoker button visible" style="margin: auto;">JOIN</button>
                            <i class="icon-spin3 hidden"></i>
                        </td>
                        <td class="players">${data.user1}</td>
                        <td class="players">${data.user2}</td>
                        <td class="players">${data.user3}</td>
                        <td class="players">${data.user4}</td>
                    </tr>
                `);
                attachJoinHandlers();
                const $tableContainer = $('#poker-table-container');
                $tableContainer.animate({
                    scrollTop: $tableContainer[0].scrollHeight
                }, 500);
            })
            .fail(function(error) {
                console.error('Error:', error);
            });
    });

    function updateServerList() {
        $.get('/servers-dataPoker')
            .done(function(jsonData) {
                var scrollPos = $(window).scrollTop();
                $('#serversTablePoker tbody').empty();

                jsonData.forEach((server, index) => {
                    let joinButton = 'FULL';
                    if (server.players < 4 && server.full == 0) {
                        joinButton = '<button class="joinPoker button visible">JOIN</button>';
                    }

                    $('#serversTablePoker tbody').append(`
                        <tr id="server-${index}">
                            <td class="server">SERVER ${index + 1}</td>
                            <td class="button_spin" data-index="${index}" data-players="${server.players}">
                                ${joinButton}
                                <i class="icon-spin3 hidden"></i>
                            </td>
                            <td class="players">${server.user1}</td>
                            <td class="players">${server.user2}</td>
                            <td class="players">${server.user3}</td>
                            <td class="players">${server.user4}</td>
                        </tr>
                    `);
                });

                scroll = false;

                if (find) {
                    highlightUserRow(jsonData);
                }
                attachJoinHandlers();
                $('#poker-table-container').css('visibility', 'visible');
            })
            .fail(function(error) {
                console.error('Error updating server list:', error);
            });
    }

    function attachJoinHandlers() {
        $('.joinPoker').off('click').on('click', function(event) {
            event.preventDefault();
            const inputText = $('#yourNamePoker').val().trim();
            if (!inputText) {
                alert('Please enter text before joining a server.');
                return;
            }

            const $joinButton = $(this);
            $joinButton.prop('disabled', true);

            const serverJoin = $joinButton.closest('.button_spin');
            const serverIndex = serverJoin.data('index');

            $.get('/servers-dataPoker')
                .done(function(jsonData) {
                    const latestServerData = jsonData[serverIndex];

                    if (latestServerData.user1 === inputText || latestServerData.user2 === inputText ||
                        latestServerData.user3 === inputText || latestServerData.user4 === inputText
                    ) {
                        alert('You cannot use the same name as an existing player.');
                        $joinButton.prop('disabled', false);
                        return;
                    }

                    if (latestServerData.players < 4 && latestServerData.full != 1) {
                        $.post('/submitPoker', { inputText: inputText, index: serverIndex })
                            .done(function(data) {
                                localStorage.setItem('serverData', JSON.stringify({
                                    inputText: inputText,
                                    index: serverIndex,
                                    players: data.players,
                                    
                                }));
                                window.location.href = '/poker';
                            })
                            .fail(function(error) {
                                console.error('Error:', error);
                                $joinButton.prop('disabled', false);
                            });
                    } 
                })
                .fail(function(error) {
                    console.error('Error fetching latest server data:', error);
                    $joinButton.prop('disabled', false);
                });
        });
    }

    updateServerList();

    $(document).on('click', '#find_playersPoker', function() {
        $.get('/findPoker')
            .done(function(jsonData) {
                find = true;
                scroll = true;
                highlightUserRow(jsonData);
                if (rowsToScroll.length > 0) scrollToNextRow(); // Scroll to the first row immediately
            })
            .fail(function(error) {
                console.error('Error fetching player data:', error);
            });
    });

    const findPlayersButton = document.getElementById('find_playersPoker');
    findPlayersButton.addEventListener('click', () => {
        const playersNamePokerInput = document.getElementById('playersNamePoker');
        playerName = playersNamePokerInput.value.trim();
        console.log(`Player's name input: ${playerName}`);
    });

    setInterval(updateServerList, 5000);
});
