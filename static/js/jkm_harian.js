function navigateToMenu() {
    window.location.href = "./menu.html";
}

function navigateToGangguan() {
    window.location.href = "./temuan_gangguan.html";
}

function navigateToPemeliharaan() {
    window.location.href = "./pemeliharaan.html";
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
    } else if (url.includes('pemeliharaan.html')) {
        document.getElementById('pemeliharaanButton').classList.add('active');
    }
}
window.onload = setActiveTab;

let currentDate = new Date();

document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonthYearDisplay();
    loadTableData();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonthYearDisplay();
    loadTableData();
});

function updateMonthYearDisplay() {
    const monthYearText = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonthYear').innerText = monthYearText;
}

function loadTableData() {
    const month = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const year = currentDate.getFullYear();

    // Buat request ke server untuk mengambil data berdasarkan bulan dan tahun
    fetch(`/getJkmDataByMonth?month=${month}&year=${year}`)
        .then(response => response.json())
        .then(data => {
            renderTable(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function renderTable(data) {
    const table = document.getElementById('dataTable');
    table.innerHTML = ''; // Kosongkan tabel sebelum mengisi data baru

    // Buat header tabel
    const header = table.createTHead().insertRow();
    ['Tanggal', 'Unit Mesin', 'JKM Harian', 'Jumlah JKM HAR', 'JSMO', 'JSB', 'Keterangan'].forEach(text => {
        const th = document.createElement('th');
        th.innerText = text;
        header.appendChild(th);
    });

    // Isi tabel dengan data
    data.forEach(row => {
        const tr = table.insertRow();
        tr.insertCell(0).innerText = row.tanggal;
        tr.insertCell(1).innerText = row.unit_mesin;
        tr.insertCell(2).innerText = row.jkm_harian;
        tr.insertCell(3).innerText = row.jumlah_jkm_har;
        tr.insertCell(4).innerText = row.jsmo;
        tr.insertCell(5).innerText = row.jsb;
        tr.insertCell(6).innerText = row.keterangan;
    });
}

// Inisialisasi tampilan bulan tahun dan load data pertama kali
updateMonthYearDisplay();
loadTableData();

document.addEventListener('DOMContentLoaded', () => {
    const tanggalField = document.getElementById('tanggal');
    const jumlahJkmHarField = document.getElementById('jumlah_jkm_har');
    const jsmoField = document.getElementById('jsmo');
    const jsbField = document.getElementById('jsb');
    const unitMesinDropdown = document.getElementById('unit_mesin_dropdown');
    const unitMesinField = document.getElementById('unit_mesin');

    function toggleFieldsBasedOnDate() {
        const selectedDate = new Date(tanggalField.value);
        const isFirstDayOfMonth = selectedDate.getDate() === 1;

        if (isFirstDayOfMonth) {
            // Jika tanggal 1, wajib mengisi Jumlah JKM HAR, JSMO, dan JSB
            jumlahJkmHarField.disabled = false;
            jumlahJkmHarField.required = true;
            jsmoField.disabled = false;
            jsmoField.required = true;
            jsbField.disabled = false;
            jsbField.required = true;
        } else {
            // Jika bukan tanggal 1, field Jumlah JKM HAR, JSMO, dan JSB di-disable
            jumlahJkmHarField.disabled = true;
            jumlahJkmHarField.required = false;
            jsmoField.disabled = true;
            jsmoField.required = false;
            jsbField.disabled = true;
            jsbField.required = false;
        }
    }

    toggleFieldsBasedOnDate();

    tanggalField.addEventListener('change', toggleFieldsBasedOnDate);

    // Tampilkan data awal berdasarkan pilihan dropdown
    displayTableData(unitMesinDropdown.value);

    // Event listener untuk mengubah tampilan tabel saat dropdown unit_mesin_dropdown berubah
    unitMesinDropdown.addEventListener('change', () => {
        displayTableData(unitMesinDropdown.value);
    });

    // Fungsi untuk menangani submit form
    function handleSubmit(event) {
        event.preventDefault();
    
        const form = document.getElementById('jkmForm');
        const formData = new FormData(form);
        
        fetch('/saveJkmData', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(err => {
                    throw new Error(err.message);
                });
            }
        })
        .then(data => {
            // Handle successful submission
            alert('Data berhasil disimpan');
            displayTableData(document.getElementById('unit_mesin').value);
            form.reset(); //clear form setelah submit
        })
        .catch(error => {
            // Handle errors
            alert(error.message);
        });
    }

    // Fungsi untuk menampilkan data di tabel
    function displayTableData(unit_mesin) {
        fetch(`/getJkmData?unit_mesin=${unit_mesin}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#dataTable tbody');
                tableBody.innerHTML = ''; // Hapus isi tabel sebelumnya

                data.forEach(item => {
                    const row = document.createElement('tr');
                    
                    // Buat elemen <td> untuk setiap kolom
                    const tanggal = document.createElement('td');
                    tanggal.textContent = item.tanggal;
                    row.appendChild(tanggal);

                    const jkmHarian = document.createElement('td');
                    jkmHarian.textContent = item.jkm_harian;
                    row.appendChild(jkmHarian);

                    const jumlahJkmHar = document.createElement('td');
                    jumlahJkmHar.textContent = item.jumlah_jkm_har;
                    row.appendChild(jumlahJkmHar);

                    const jsmo = document.createElement('td');
                    jsmo.textContent = item.jsmo;
                    row.appendChild(jsmo);

                    const jsb = document.createElement('td');
                    jsb.textContent = item.jsb;
                    row.appendChild(jsb);

                    const keterangan = document.createElement('td');
                    keterangan.textContent = item.keterangan;
                    row.appendChild(keterangan);

                    // Kolom untuk tindakan seperti mengedit atau menghapus data
                    const action = document.createElement('td');
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'deleteButton';
                    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteButton.addEventListener('click', () => deleteData(item._id, unit_mesin));
                    action.appendChild(deleteButton);
                    row.appendChild(action);

                    // Tambahkan baris ke tabel
                    tableBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // Fungsi untuk menghapus data
    function deleteData(id, unit_mesin) {
        fetch(`/deleteJkmData/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert('Data berhasil dihapus');
                displayTableData(unit_mesin); // Refresh tabel setelah penghapusan
            }
        })
        .catch(error => console.error('Error deleting data:', error));
    }

    // Tambahkan event listener untuk handleSubmit saat form di-submit
    document.getElementById('jkmForm').addEventListener('submit', handleSubmit);
});