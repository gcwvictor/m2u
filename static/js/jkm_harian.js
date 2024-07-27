function navigateToMenu() {
    window.location.href = "./menu.html";
}

function navigateToGangguan() {
    window.location.href = "./temuan_gangguan.html";
}

function navigateToJKM() {
    window.location.href = "./jkm_harian.html";
}

function setActiveTab() {
    const url = window.location.pathname;
    document.querySelectorAll('.tabButton').forEach(button => {
        button.classList.remove('active');
    });

    if (url.includes('jkm_harian.html')) {
        document.getElementById('jkmButton').classList.add('active');
    } else if (url.includes('temuan_gangguan.html')) {
        document.getElementById('gangguanButton').classList.add('active');
    }
}

window.onload = setActiveTab;

document.addEventListener('DOMContentLoaded', loadFromDatabase);

function handleDateChange(event) {
    const date = event.target.value;
    const jumlahJKMHarianField = document.getElementById('jumlah_jkm_har');
    const jsmoField = document.getElementById('jsmo');
    const jsbField = document.getElementById('jsb');

    const currentDate = new Date(date);
    const day = currentDate.getDate();

    if (day === 1) {
        jumlahJKMHarianField.required = true;
        jsmoField.required = true;
        jsbField.required = true;

        jumlahJKMHarianField.disabled = false;
        jsmoField.disabled = false;
        jsbField.disabled = false;

        jumlahJKMHarianField.value = '';
        jsmoField.value = '';
        jsbField.value = '';

    } else {
        jumlahJKMHarianField.required = false;
        jsmoField.required = false;
        jsbField.required = false;

        jumlahJKMHarianField.disabled = true;
        jsmoField.disabled = true;
        jsbField.disabled = true;

        const unitMesin = document.querySelector('select[name="unit_mesin"]').value;
        getPreviousDayData(date, unitMesin).then(previousData => {
            if (previousData) {
                jumlahJKMHarianField.value = previousData.jumlah_jkm_har || 0;
                jsmoField.value = previousData.jsmo || 0;
                jsbField.value = previousData.jsb || 0;
            } else {
                jumlahJKMHarianField.value = 0;
                jsmoField.value = 0;
                jsbField.value = 0;
            }
        });
    }
}

async function getPreviousDayData(date, unitMesin) {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDate = currentDate.toISOString().split('T')[0];

    const response = await fetch(`/getJkmData?unit_mesin=${unitMesin}&tanggal=${previousDate}`);
    const data = await response.json();

    return data.length > 0 ? data[0] : null;
}

async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    const tableId = `table${data.unit_mesin}`;
    const table = document.getElementById(tableId)?.querySelector('tbody');
    const newRow = document.createElement('tr');

    if (!await validateSequentialDates(data.tanggal, data.unit_mesin)) {
        return;
    }

    if (!validateDate(data.tanggal)) {
        alert('Tanggal harus diisi dengan benar!');
        return;
    }

    if (!isFirstOfMonth(data.tanggal)) {
        data.jumlah_jkm_har = await calculateJumlahJKMHarian(data.tanggal, data.unit_mesin);
        data.jsmo = await calculateJSMO(data.tanggal, data.unit_mesin);
        data.jsb = await calculateJSB(data.tanggal, data.unit_mesin);
    }

    const response = await fetch('/saveJkmData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        const savedData = await response.json();
        addRowToTable(table, savedData);
        event.target.reset();
    } else {
        alert('Error saving data');
    }
}

function validateDate(date) {
    const selectedDate = new Date(date);
    return selectedDate instanceof Date && !isNaN(selectedDate);
}

function isFirstOfMonth(date) {
    const d = new Date(date);
    return d.getDate() === 1;
}

async function calculateJumlahJKMHarian(date, unitMesin) {
    const previousDayData = await getPreviousDayData(date, unitMesin);

    if (previousDayData) {
        const previousJumlahJKMHarian = parseFloat(previousDayData.jumlah_jkm_har) || 0;
        const currentJKMHarian = parseFloat(document.querySelector('input[name="jkm_harian"]').value) || 0;
        return previousJumlahJKMHarian + currentJKMHarian;
    }

    return 'N/A';
}

async function calculateJSMO(date, unitMesin) {
    const previousDayData = await getPreviousDayData(date, unitMesin);

    if (previousDayData) {
        const previousJSMO = parseFloat(previousDayData.jsmo) || 0;
        const currentJKMHarian = parseFloat(document.querySelector('input[name="jkm_harian"]').value) || 0;
        return previousJSMO + currentJKMHarian;
    }

    return 'N/A';
}

async function calculateJSB(date, unitMesin) {
    const previousDayData = await getPreviousDayData(date, unitMesin);

    if (previousDayData) {
        const previousJSB = parseFloat(previousDayData.jsb) || 0;
        const currentJKMHarian = parseFloat(document.querySelector('input[name="jkm_harian"]').value) || 0;
        return previousJSB + currentJKMHarian;
    }

    return 'N/A';
}

async function validateSequentialDates(date, unitMesin) {
    const currentDate = new Date(date);

    for (let i = 1; i < currentDate.getDate(); i++) {
        const previousDate = new Date(currentDate);
        previousDate.setDate(i);
        const previousDateString = previousDate.toISOString().split('T')[0];

        const response = await fetch(`/getJkmData?unit_mesin=${unitMesin}&tanggal=${previousDateString}`);
        const data = await response.json();

        if (data.length === 0) {
            alert(`Tanggal ${previousDateString} belum diisi. Harap mengisi tanggal tersebut terlebih dahulu.`);
            return false;
        }
    }

    return true;
}

async function loadFromDatabase() {
    for (let i = 1; i <= 4; i++) {
        const tableId = `table${i}`;
        const table = document.getElementById(tableId)?.querySelector('tbody');
        if (table) {
            const response = await fetch(`/getJkmData?unit_mesin=${i}`);
            const existingData = await response.json();

            existingData.forEach(data => {
                addRowToTable(table, data);
            });
        }
    }
}

function addRowToTable(table, data) {
    if (!table) return;

    const newRow = document.createElement('tr');
    const fields = ['tanggal', 'jkm_harian', 'jumlah_jkm_har', 'jsmo', 'jsb', 'keterangan'];

    fields.forEach(field => {
        const newCell = document.createElement('td');
        newCell.textContent = data[field] || '';
        newRow.appendChild(newCell);
    });

    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteButton';
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.onclick = async function() {
        const response = await fetch(`/deleteJkmData/${data._id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            table.removeChild(newRow);
        } else {
            alert('Error deleting data');
        }
    };
    deleteCell.appendChild(deleteButton);
    newRow.appendChild(deleteCell);

    table.appendChild(newRow);
}

function exportTables() {
    const tableIds = ['table1', 'table2', 'table3', 'table4'];
    const sheetNames = ['Mesin 1', 'Mesin 2', 'Mesin 3', 'Mesin 4'];

    const wb = XLSX.utils.book_new();

    tableIds.forEach((tableId, index) => {
        const table = document.getElementById(tableId);
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, sheetNames[index]);
    });

    XLSX.writeFile(wb, 'JKM Harian.xlsx');
}

document.addEventListener('DOMContentLoaded', loadFromDatabase);
