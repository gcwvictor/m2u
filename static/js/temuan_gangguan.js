function navigateToJKM(){
    window.location.href = "./jkm_harian.html";
}

function navigateToHome(){
      window.location.href = "./index.html";
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

document.addEventListener('DOMContentLoaded', (event) => {
    displayTableData();
});

function handleSubmit(event) {
    event.preventDefault();

    const tanggal = document.getElementById('tanggal').value;
    const namaGangguan = document.getElementById('nama_gangguan').value;
    const unitMesin = document.getElementById('unit_mesin').value;
    const foto = document.getElementById('foto').files[0];

    if (foto) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fotoDataUrl = e.target.result;
            const gangguanData = {
                tanggal: tanggal,
                namaGangguan: namaGangguan,
                unitMesin: unitMesin,
                foto: fotoDataUrl
            };
            saveData(gangguanData);
            displayTableData();
        };
        reader.readAsDataURL(foto);
    } else {
        const gangguanData = {
            tanggal: tanggal,
            namaGangguan: namaGangguan,
            unitMesin: unitMesin,
            foto: ''
        };
        saveData(gangguanData);
        displayTableData();
    }

    document.getElementById('gangguanForm').reset();
}

function saveData(data) {
    let existingData = JSON.parse(localStorage.getItem('gangguanData')) || [];
    existingData.push(data);
    localStorage.setItem('gangguanData', JSON.stringify(existingData));
}

function displayTableData() {
    const tableBody = document.querySelector('#table1 tbody');
    tableBody.innerHTML = '';
    const data = JSON.parse(localStorage.getItem('gangguanData')) || [];
    
    data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    data.forEach((item, index) => {
        const row = document.createElement('tr');

        const tanggalCell = document.createElement('td');
        tanggalCell.textContent = item.tanggal;
        row.appendChild(tanggalCell);

        const namaGangguanCell = document.createElement('td');
        namaGangguanCell.textContent = item.namaGangguan;
        row.appendChild(namaGangguanCell);

        const unitMesinCell = document.createElement('td');
        unitMesinCell.textContent = item.unitMesin;
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
        deleteButton.onclick = () => deleteRow(index);
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        tableBody.appendChild(row);
    });
}

function deleteRow(index) {
    let data = JSON.parse(localStorage.getItem('gangguanData')) || [];
    data.splice(index, 1);
    localStorage.setItem('gangguanData', JSON.stringify(data));
    displayTableData();
}

document.getElementById('exportTable').addEventListener('click', function() {
    const data = JSON.parse(localStorage.getItem('gangguanData')) || [];

    const exportData = data.map(item => ({
        'Tanggal': item.tanggal,
        'Keterangan': item.namaGangguan,
        'Unit Mesin': item.unitMesin,
        'Foto': item.foto ? `Link: ${item.foto}` : 'No Image'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: ['Tanggal', 'Keterangan', 'Unit Mesin', 'Foto'] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Temuan Gangguan");
    XLSX.writeFile(workbook, 'Temuan Gangguan.xlsx');
});
