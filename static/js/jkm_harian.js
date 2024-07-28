function navigateToMenu() {
    window.location.href = "./menu.html";
}

function navigateToGangguan() {
    window.location.href = "./temuan_gangguan.html";
}

function navigateToJKM() {
    window.location.href = "./jkm_harian.html";
}

function navigateToLogout() {
    window.location.href = "/logout";
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

document.addEventListener('DOMContentLoaded', () => {
    const unitMesinDropdown = document.getElementById('unit_mesin_dropdown');
    if (unitMesinDropdown) {
        unitMesinDropdown.addEventListener('change', loadFromDatabase);
    }
    loadFromDatabase();
});

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
        getLastDayData(unitMesin).then(previousData => {
            if (previousData) {
                jumlahJKMHarianField.value = previousData.jumlah_jkm_har || 0;
                jsmoField.value = previousData.jsmo || 0;
                jsbField.value = previousData.jsb || 0;
            } else {
                alert(`Tanggal ${date} tidak bisa dipilih karena data tanggal sebelumnya tidak ada.`);
                clearFields();
                disableAllFieldsExceptDate();
            }
        });
    }
}

async function getLastDayData(unitMesin) {
    const response = await fetch(`/getLastJkmData?unit_mesin=${unitMesin}`);
    const data = await response.json();

    return data.length > 0 ? data[0] : null;
}

function isFirstOfMonth(date) {
    const d = new Date(date);
    return d.getDate() === 1;
}

async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    if (!validateDate(data.tanggal)) {
        alert('Tanggal harus diisi dengan benar!');
        return;
    }

    if (!await validateSequentialDates(data.tanggal, data.unit_mesin)) {
        return;
    }

    if (!isFirstOfMonth(data.tanggal)) {
        data.jumlah_jkm_har = await calculateJumlahJKMHarian(data.tanggal, data.unit_mesin);
        data.jsmo = await calculateJSMO(data.tanggal, data.unit_mesin);
        data.jsb = await calculateJSB(data.tanggal, data.unit_mesin);
    }

    try {
        const response = await fetch('/saveJkmData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Data saved successfully');
            displayTableData(data.unit_mesin); // Refresh the table data after saving
        } else {
            alert('Error saving data');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }

    event.target.reset();
}

function validateDate(date) {
    const selectedDate = new Date(date);
    return selectedDate instanceof Date && !isNaN(selectedDate);
}

async function validateSequentialDates(date, unit_mesin) {
    const currentDate = new Date(date);

    for (let i = 1; i < currentDate.getDate(); i++) {
        const previousDate = new Date(currentDate);
        previousDate.setDate(i);
        const previousDateString = previousDate.toISOString().split('T')[0];

        const response = await fetch(`/getJkmData?unit_mesin=${unit_mesin}&tanggal=${previousDateString}`);
        const data = await response.json();

        if (data.length === 0) {
            alert(`Tanggal ${previousDateString} belum diisi. Harap mengisi tanggal tersebut terlebih dahulu.`);
            return false;
        }
    }

    return true;
}

async function calculateJumlahJKMHarian(date, unit_mesin) {
    const previousDayData = await getLastDayData(unit_mesin);

    if (previousDayData) {
        const previousJumlahJKMHarian = parseFloat(previousDayData.jumlah_jkm_har) || 0;
        const currentJKMHarian = parseFloat(document.querySelector('input[name="jkm_harian"]').value) || 0;
        return previousJumlahJKMHarian + currentJKMHarian;
    }

    return 'N/A';
}

async function calculateJSMO(date, unit_mesin) {
    const previousDayData = await getLastDayData(unit_mesin);

    if (previousDayData) {
        const previousJSMO = parseFloat(previousDayData.jsmo) || 0;
        const currentJKMHarian = parseFloat(document.querySelector('input[name="jkm_harian"]').value) || 0;
        return previousJSMO + currentJKMHarian;
    }

    return 'N/A';
}

async function calculateJSB(date, unit_mesin) {
    const previousDayData = await getLastDayData(unit_mesin);

    if (previousDayData) {
        const previousJSB = parseFloat(previousDayData.jsb) || 0;
        const currentJKMHarian = parseFloat(document.querySelector('input[name="jkm_harian"]').value) || 0;
        return previousJSB + currentJKMHarian;
    }

    return 'N/A';
}

function enableAllFields() {
    const fields = document.querySelectorAll('.formField input, .formField select');
    fields.forEach(field => {
        field.disabled = false;
    });
}

function disableAllFieldsExceptDate() {
    const fields = document.querySelectorAll('.formField input, .formField select');
    fields.forEach(field => {
        if (field.id !== 'tanggal') {
            field.disabled = true;
        }
    });
}

function clearFields() {
    const fields = document.querySelectorAll('.formField input');
    fields.forEach(field => {
        field.value = '';
    });
}

async function loadFromDatabase() {
    const unit_mesin = document.getElementById('unit_mesin_dropdown').value;
    displayTableData(unit_mesin);
}

async function displayTableData(unit_mesin) {
    try {
        const response = await fetch(`/getJkmData?unit_mesin=${unit_mesin}`);
        const data = await response.json();
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = '';

        data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

        data.forEach((item) => {
            const row = document.createElement('tr');

            const tanggalCell = document.createElement('td');
            tanggalCell.textContent = item.tanggal;
            row.appendChild(tanggalCell);

            const jkmHarianCell = document.createElement('td');
            jkmHarianCell.textContent = item.jkm_harian;
            row.appendChild(jkmHarianCell);

            const jumlahJkmHarCell = document.createElement('td');
            jumlahJkmHarCell.textContent = item.jumlah_jkm_har;
            row.appendChild(jumlahJkmHarCell);

            const jsmoCell = document.createElement('td');
            jsmoCell.textContent = item.jsmo;
            row.appendChild(jsmoCell);

            const jsbCell = document.createElement('td');
            jsbCell.textContent = item.jsb;
            row.appendChild(jsbCell);

            const keteranganCell = document.createElement('td');
            keteranganCell.textContent = item.keterangan;
            row.appendChild(keteranganCell);

            const deleteCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'deleteButton';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.onclick = () => deleteRow(item._id);
            deleteCell.appendChild(deleteButton);
            row.appendChild(deleteCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}

async function deleteRow(id) {
    try {
        const response = await fetch(`/deleteJkmData/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Data deleted successfully');
            loadFromDatabase(); // Refresh the table data after deletion
        } else {
            alert('Error deleting data');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

document.getElementById('exportTable').addEventListener('click', function() {
    exportTableData();
});

async function exportTableData() {
    try {
        const unitMesins = [
            { id: 1, name: 'DEUTZ MWM 616 - 220510' },
            { id: 2, name: 'MTU 18V 2000 G62' },
            { id: 3, name: 'MTU 12V 2000 G62' },
            { id: 4, name: 'DEUTZ MWM 616 - 2204728' }
        ];

        const workbook = XLSX.utils.book_new();

        for (const unitMesin of unitMesins) {
            const response = await fetch(`/getJkmData?unit_mesin=${unitMesin.id}`);
            const data = await response.json();

            const exportData = data.map(item => ({
                'Tanggal': item.tanggal,
                'JKM Harian': item.jkm_harian,
                'Jumlah JKM Harian': item.jumlah_jkm_har,
                'JSMO': item.jsmo,
                'JSB': item.jsb,
                'Keterangan': item.keterangan
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData, { header: ['Tanggal', 'JKM Harian', 'Jumlah JKM Harian', 'JSMO', 'JSB', 'Keterangan'] });
            XLSX.utils.book_append_sheet(workbook, worksheet, unitMesin.name);
        }

        XLSX.writeFile(workbook, 'JKM_Harian_All_Machines.xlsx');
    } catch (error) {
        console.error('Error exporting data: ', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const unit_mesin = document.querySelector('select[name="unit_mesin"]').value;
    displayTableData(unit_mesin);

    const exportButton = document.querySelector('.btnExport');
    if (exportButton) {
        exportButton.addEventListener('click', exportAllData);
    }
});
