const sheetID = '1X1baU4cnYWuJvLJpJqMhob6slgx6XZZI5O_M3mjYsKM';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?`;
const sheetName = 'Online tickets';
const output = document.querySelector('.output');

function fetchData(searchValue) {
    const query = `SELECT A,B,C WHERE S = '${searchValue}' OR T = '${searchValue}' OR U = '${searchValue}' OR V = '${searchValue}'`;
    const url = `${base}&sheet=${sheetName}&tq=${encodeURIComponent(query)}`;

    fetch(url)
        .then(res => res.text())
        .then(rep => {
            try {
                const jsData = JSON.parse(rep.substr(47).slice(0, -2));
                if (!jsData.table.rows.length) throw "Không tìm thấy dữ liệu cho mã vé này.";

                const rowData = jsData.table.rows[0].c;
                const customer = rowData[0].v || "Không có thông tin";
                const phone = rowData[1].v || "Không có thông tin";
                const email = rowData[2].v || "Không có thông tin";

                output.innerHTML = `<p>Họ và Tên: ${customer}</p>
                                    <p>Số điện thoại: ${phone}</p>
                                    <p>Email: ${email}</p>`;

            } catch (error) {
                output.innerHTML = `<p>${error}</p>`;
            }
        })
        .catch(error => output.innerHTML = "<p>Đã xảy ra lỗi khi lấy dữ liệu.</p>");
}

document.getElementById('searchButton').addEventListener('click', function() {
    const searchValue = document.getElementById('searchInput').value;
    fetchData(searchValue);
});
