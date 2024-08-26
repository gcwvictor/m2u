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

let currentMonth = new Date().getMonth(); // 0 = January, 11 = December
let currentYear = new Date().getFullYear();

document.getElementById('prevMonthBtn').addEventListener('click', () => {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
    } else {
        currentMonth--;
    }
    updateMonthDisplay();
    fetchAndDisplayData();
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
    } else {
        currentMonth++;
    }
    updateMonthDisplay();
    fetchAndDisplayData();
});

function updateMonthDisplay() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

async function fetchAndDisplayData(unit_mesin = null) {
    try {
        // Dapatkan unit_mesin yang dipilih atau gunakan nilai default dari dropdown
        const mesin = unit_mesin || document.getElementById('unit_mesin_dropdown').value;
        const response = await fetch(`/getJkmData?unit_mesin=${mesin}`);
        const data = await response.json();

        // Filter data berdasarkan bulan dan tahun yang saat ini dipilih
        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.tanggal);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        });

        // Update tampilan tabel dengan data yang telah difilter
        const tbody = document.getElementById('dataTable').querySelector('tbody');
        tbody.innerHTML = '';

        filteredData.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.tanggal}</td>
                <td>${entry.jkm_harian}</td>
                <td>${entry.jumlah_jkm_har}</td>
                <td>${entry.jsmo}</td>
                <td>${entry.jsb}</td>
                <td>${entry.keterangan || ''}</td>
            `;
            // Kolom untuk tindakan seperti mengedit atau menghapus data
            const action = document.createElement('td');

            // Tambahkan tombol hapus
            const deleteButton = document.createElement('button');
            deleteButton.className = 'deleteButton';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.addEventListener('click', () => deleteData(entry._id, mesin));
            action.appendChild(deleteButton);

            row.appendChild(action);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Fungsi untuk menghapus data
function deleteData(id, unit_mesin) {
    fetch(`/deleteJkmData/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            alert('Data berhasil dihapus');
            fetchAndDisplayData(unit_mesin); // Refresh tabel setelah penghapusan
        }
    })
    .catch(error => console.error('Error deleting data:', error));
}

// Panggil fetchAndDisplayData() setiap kali dropdown unit_mesin berubah
document.getElementById('unit_mesin_dropdown').addEventListener('change', () => {
    fetchAndDisplayData(document.getElementById('unit_mesin_dropdown').value);
});

// Inisialisasi tampilan awal bulan dan tabel
updateMonthDisplay();
fetchAndDisplayData();

// Event listener dan logika untuk form input
document.addEventListener('DOMContentLoaded', () => {
    const tanggalField = document.getElementById('tanggal');
    const jumlahJkmHarField = document.getElementById('jumlah_jkm_har');
    const jsmoField = document.getElementById('jsmo');
    const jsbField = document.getElementById('jsb');

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
            fetchAndDisplayData(document.getElementById('unit_mesin').value);
            form.reset(); //clear form setelah submit
        })
        .catch(error => {
            // Handle errors
            alert(error.message);
        });
    }

    // Tambahkan event listener untuk handleSubmit saat form di-submit
    document.getElementById('jkmForm').addEventListener('submit', handleSubmit);
});

document.getElementById('btnExport').addEventListener('click', exportTableToExcel);

async function exportTableToExcel() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    // Tampilkan overlay saat mulai loading
    loadingOverlay.style.display = 'flex';
    
    try {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = monthNames[currentMonth];
        const fileName = `JKM Harian (${currentMonthName} ${currentYear}).xlsx`;

        const unitMesins = Array.from(document.getElementById('unit_mesin_dropdown').options).map(option => option.value);
        const workbook = XLSX.utils.book_new();

        const mesinNamesMap = {
            '1': '1. S/N 2205106',
            '2': '2. S/N 539100415',
            '3': '3. S/N 535102284',
            '4': '4. S/N 2204728'
        };

        for (const unit_mesin of unitMesins) {
            const response = await fetch(`/getJkmData?unit_mesin=${unit_mesin}`);
            const data = await response.json();

            const filteredData = data.filter(entry => {
                const entryDate = new Date(entry.tanggal);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            });

            const rows = [
                ["Tanggal", "Unit Mesin", "JKM Harian", "Jumlah JKM HAR", "JSMO", "JSB", "Keterangan"]
            ];

            filteredData.forEach(entry => {
                rows.push([
                    entry.tanggal,
                    mesinNamesMap[unit_mesin],  // Gunakan nama mesin yang dikustomisasi
                    entry.jkm_harian,
                    entry.jumlah_jkm_har,
                    entry.jsmo,
                    entry.jsb,
                    entry.keterangan || ''
                ]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            const sheetName = mesinNamesMap[unit_mesin];  // Gunakan nama mesin yang dikustomisasi sebagai nama sheet
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Terjadi kesalahan saat mengekspor data.');
    } finally {
        // Sembunyikan overlay setelah proses selesai
        loadingOverlay.style.display = 'none';
    }
}