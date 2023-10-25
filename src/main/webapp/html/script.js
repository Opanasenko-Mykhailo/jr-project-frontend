$(document).ready(function () {
    let currentPage = 1;
    let itemsPerPage = 5;
    let totalPages = 1;
    const uniqueRaces = ['HUMAN', 'DWARF', 'ELF', 'GIANT', 'ORC', 'TROLL', 'HOBBIT'];
    const uniqueProfessions = ['WARRIOR', 'ROGUE', 'SORCERER', 'CLERIC', 'PALADIN', 'NAZGUL', 'WARLOCK', 'DRUID'];
    const uniqueBannedStatuses = [true, false];

    function formatBirthday(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    $.get(`http://localhost:8080/rest/players`, function (players) {
        updateAccountsTable(currentPage, itemsPerPage);
        updatePaginationButtons();
    });

    const raceSelect = $('#race');
    const professionSelect = $('#profession');
    const bannedSelect = $('#banned');

    uniqueRaces.forEach(race => {
        raceSelect.append(`<option value="${race}">${race}</option>`);
    });

    uniqueProfessions.forEach(profession => {
        professionSelect.append(`<option value="${profession}">${profession}</option>`);
    });

    uniqueBannedStatuses.forEach(status => {
        bannedSelect.append(`<option value="${status}">${status}</option>`);
    });

    $('#createAccountButton').click(function () {
        const name = $('#name').val();
        const title = $('#title').val();
        const race = $('#race').val();
        const profession = $('#profession').val();
        const level = $('#level').val();
        const birthday = $('#birthday').val();
        const banned = $('#banned').val();

        if (name && title && race && profession && level && birthday) {
            const newAccount = {
                name: name,
                title: title,
                race: race,
                profession: profession,
                level: parseInt(level),
                birthday: new Date(birthday).getTime(),
                banned: banned === "true"
            };

            $.ajax({
                url: 'http://localhost:8080/rest/players',
                type: 'POST',
                data: JSON.stringify(newAccount),
                contentType: 'application/json',
                success: function (response) {
                    $('#name').val('');
                    $('#title').val('');
                    $('#race').val(uniqueRaces[0]);
                    $('#profession').val(uniqueProfessions[0]);
                    $('#level').val('');
                    $('#birthday').val('');
                    $('#banned').val(uniqueBannedStatuses[1]);

                    updateAccountsTable(currentPage, itemsPerPage);
                    updatePaginationButtons();
                },
                error: function (error) {
                    console.log('Error creating an account:', error);
                }
            });
        } else {
            console.log('Invalid user input.');
        }
    });

    $('#itemsPerPage').change(function () {
        itemsPerPage = parseInt($(this).val());
        currentPage = 1;
        updateAccountsTable(currentPage, itemsPerPage);
        updatePaginationButtons();
    });

    $('.accounts-table-body').on('click', '.edit-button', function () {
        const $row = $(this).closest('tr');
        const playerId = $(this).data('id');
        enableEditingMode($row);
        createRaceAndProfessionSelects($row);

        $(this).html('<img src="/img/free-icon-floppy-disk-10357881.png" width="30">');
        $(this).off('click').on('click', function () {
            editPlayer(playerId);
        });
    });

    $('.accounts-table-body').on('click', '.delete-button', function () {
        const playerId = $(this).data('id');
        $.ajax({
            url: `http://localhost:8080/rest/players/${playerId}`,
            type: 'DELETE',
            success: function (response) {
                updateAccountsTable(currentPage, itemsPerPage);
                updatePaginationButtons();
            },
            error: function (error) {
                console.log('Error deleting a player:', error);
            }
        });
    });

    function enableEditingMode($row) {
        $row.find('.editable').prop('disabled', false);
        $row.find('.edit-race').prop('disabled', true);
        $row.find('.edit-profession').prop('disabled', true);
        $row.find('.edit-banned').prop('disabled', true);
    }

    function createRaceAndProfessionSelects($row) {
        const $raceSelect = $('<select class="editable edit-race"></select>');
        uniqueRaces.forEach(race => {
            const $option = $(`<option value="${race}">${race}</option>`);
            $raceSelect.append($option);
        });
        $raceSelect.val($row.find('.edit-race').text());
        $row.find('.edit-race').html($raceSelect);

        const $professionSelect = $('<select class="editable edit-profession"></select>');
        uniqueProfessions.forEach(profession => {
            const $option = $(`<option value="${profession}">${profession}</option>`);
            $professionSelect.append($option);
        });
        $professionSelect.val($row.find('.edit-profession').text());
        $row.find('.edit-profession').html($professionSelect);

        const $bannedSelect = $('<select class="editable edit-banned"></select>');
        uniqueBannedStatuses.forEach(banned => {
            const $option = $(`<option value="${banned}">${banned}</option>`);
            $bannedSelect.append($option);
        });
        $bannedSelect.val($row.find('.edit-banned').text());
        $row.find('.edit-banned').html($bannedSelect);
    }

    function updateAccountsTable(page, limit) {
        $.get(`http://localhost:8080/rest/players?pageNumber=${page - 1}&pageSize=${limit}`, function (accounts) {
            const $tableBody = $('.accounts-table-body');
            $tableBody.empty();

            accounts.forEach(account => {
                $tableBody.append(createTableRow(account));
            });
        });
    }

    function createTableRow(account) {
        return `<tr class="row">
            <td>${account.id}</td>
            <td><input class="editable edit-name" type="text" value="${account.name}" disabled></td>
            <td><input class="editable edit-title" type="text" value="${account.title}" disabled></td>
            <td class="edit-race">${account.race}</td>
            <td class="edit-profession">${account.profession}</td>
            <td>${account.level}</td>
            <td>${formatBirthday(account.birthday)}</td>
            <td class="edit-banned">${account.banned}</td>
            <td><button class="edit-button" data-id="${account.id}"><img src="/img/free-icon-edit-tools-9800979.png" width="30"></button></td>
            <td><button class="delete-button" data-id="${account.id}"><img src="/img/free-icon-bin-11520410.png" width="30"></button></td>
        </tr>`;
    }

    function editPlayer(playerId) {
        const $row = $('.edit-button[data-id="' + playerId + '"]').closest('tr');
        const editedData = {
            name: $row.find('.edit-name').val(),
            title: $row.find('.edit-title').val(),
            race: $row.find('.edit-race select').val(),
            profession: $row.find('.edit-profession select').val(),
            banned: $row.find('.edit-banned select').val()
        };

        $.ajax({
            url: `http://localhost:8080/rest/players/${playerId}`,
            type: 'POST',
            data: JSON.stringify(editedData),
            contentType: 'application/json',
            success: function (response) {
                updateAccountsTable(currentPage, itemsPerPage);
                updatePaginationButtons();
            },
            error: function (error) {
                console.log('Error editing a player:', error);
            }
        });
    }

    function updatePaginationButtons() {
        $.get('http://localhost:8080/rest/players/count', function (count) {
            totalPages = Math.ceil(count / itemsPerPage);
            const $pageButtons = $('#pagination');
            $pageButtons.empty();

            for (let i = 1; i <= totalPages; i++) {
                const $button = $('<button class="page-button">' + i + '</button>');

                if (i === currentPage) {
                    $button.addClass('current-page');
                } else {
                    $button.click(function () {
                        currentPage = i;
                        updateAccountsTable(currentPage, itemsPerPage);
                        updatePaginationButtons();
                    });
                }

                $pageButtons.append($button);
            }
        });
    }
});
