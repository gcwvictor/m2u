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
        resizeImage(file, 800, 600, async (base64Image) => {
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
        });
    }
}

function resizeImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg');
            callback(dataUrl);
        }
    }
}

async function displayTableData() {
    try {
        const response = await fetch('/getGangguanData');
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error fetching data: ${errorData.message}`);
            return;
        }

        const data = await response.json();
        console.log('Fetched data:', data);  // Log the fetched data for debugging

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
            if (item.foto && item.foto.data) {
                const img = document.createElement('img');
                img.src = `data:${item.foto.contentType};base64,${item.foto.data}`;
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
            'Foto': item.foto ? `data:${item.foto.contentType};base64,${item.foto.data}` : 'No Image'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData, { header: ['Tanggal', 'Keterangan', 'Unit Mesin', 'Foto'] });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Temuan Gangguan");
        XLSX.writeFile(workbook, 'Temuan Gangguan.xlsx');
    } catch (error) {
        console.error('Error exporting data:', error);
    }
}

document.addEventListener('DOMContentLoaded', displayTableData);
