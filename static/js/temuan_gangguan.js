function navigateToJKM() {
    window.location.href = "./jkm_harian.html";
}

function navigateToHome() {
    window.location.href = "./menu.html";
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
    const usernameElement = document.getElementById('username');
    fetch('/user')
        .then(response => response.json())
        .then(data => {
            if (usernameElement) {
                usernameElement.textContent = data.username;
            }
        })
        .catch(error => console.error('Error fetching user data:', error));

    displayTableData();
});

async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    const file = formData.get('foto');
    if (file) {
        const base64Image = await toBase64(file);
        data.foto = base64Image.split(',')[1]; // Only send the base64 part to the server

        try {
            const response = await fetch('/saveGangguanData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Data saved successfully');
                displayTableData(); // Refresh the table data after saving
            } else {
                const errorData = await response.json();
                alert(`Error saving data: ${errorData.message}`);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }

        event.target.reset();
    }
}


function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function displayTableData() {
    try {
        const response = await fetch('/getGangguanData');
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error fetching data: ${errorData.message}`);
            console.error('Response status:', response.status);
            console.error('Response status text:', response.statusText);
            console.error('Response body:', errorData);
            return;
        }

        const data = await response.json();
        const tableBody = document.querySelector('#table1 tbody');
        tableBody.innerHTML = '';

        data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

        data.forEach((item) => {
            const row = document.createElement('tr');

            const tanggalCell = document.createElement('td');
            tanggalCell.textContent = item.tanggal;
            row.appendChild(tanggalCell);

            const namaGangguanCell = document.createElement('td');
            namaGangguanCell.textContent = item.nama_gangguan;
            row.appendChild(namaGangguanCell);

            const unitMesinCell = document.createElement('td');
            unitMesinCell.textContent = item.unit_mesin;
            row.appendChild(unitMesinCell);

            const fotoCell = document.createElement('td');
            if (item.foto) {
                const img = document.createElement('img');
                img.src = item.foto;
                img.width = 100;
                img.height = 60;
                fotoCell.appendChild(img);
            } else {
                fotoCell.textContent = 'No Image';
            }
            row.appendChild(fotoCell);

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
        console.error('Error fetching data:', error);
    }
}

document.addEventListener('DOMContentLoaded', displayTableData);

async function deleteRow(id) {
    try {
        const response = await fetch(`/deleteGangguanData/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Data deleted successfully');
            displayTableData(); // Refresh the table data after deletion
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
        const response = await fetch('/getGangguanData');
        const data = await response.json();

        const exportData = data.map(item => ({
            'Tanggal': item.tanggal,
            'Keterangan': item.nama_gangguan,
            'Unit Mesin': item.unit_mesin,
            'Foto': item.foto ? `IMAGE("${item.foto}")` : 'No Image'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData, { header: ['Tanggal', 'Keterangan', 'Unit Mesin', 'Foto'] });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Temuan Gangguan");
        
        // Function to add images in Excel
        const ws = workbook.Sheets["Temuan Gangguan"];
        data.forEach((item, index) => {
            if (item.foto) {
                ws[`D${index + 2}`].l = { Target: item.foto, Tooltip: 'Image Link' };
            }
        });

        XLSX.writeFile(workbook, 'Temuan_Gangguan.xlsx');
    } catch (error) {
        console.error('Error exporting data:', error);
    }
}
