// --- 1. ข้อมูลชุดเซนเซอร์แยกตาม 2 จุดตรวจวัด ---
const stationsData = {
    A1: {
        name: "แปลงทดสอบที่ A1 (ดินปกติ)",
        ph: 6.5, n: 45, p: 28, k: 120, moisture: 65, temp: 28.5, ec: 1.2, tds: 600, salinity: 0.5,
        coords: [14.0135, 100.5312]
    },
    B2: {
        name: "แปลงทดสอบที่ B2 (ดินกรด/ชื้นสูง)",
        ph: 4.8, n: 20, p: 15, k: 140, moisture: 82, temp: 26.0, ec: 2.1, tds: 950, salinity: 1.2,
        coords: [14.0155, 100.5352]
    }
};

if (!localStorage.getItem('currentStationKey')) {
    localStorage.setItem('currentStationKey', 'A1');
}

function getCurrentSensorData() {
    const key = localStorage.getItem('currentStationKey') || 'A1';
    return stationsData[key];
}

// --- 2. ฟังก์ชันอัปเดตตัวเลขหน้าจอแดชบอร์ด (index.html) ---
function updateSensorDisplay(stationKey) {
    localStorage.setItem('currentStationKey', stationKey);
    const data = stationsData[stationKey];

    if (!document.getElementById('val-ph')) return;

    document.getElementById('val-ph').innerText = data.ph;
    document.getElementById('val-n').innerText = data.n;
    document.getElementById('val-p').innerText = data.p;
    document.getElementById('val-k').innerText = data.k;
    document.getElementById('val-moisture').innerText = data.moisture;
    document.getElementById('val-temp').innerText = data.temp;
    document.getElementById('val-ec').innerText = data.ec;
    document.getElementById('val-tds').innerText = data.tds;
    document.getElementById('val-salinity').innerText = data.salinity;
}

function switchStation(stationKey) {
    updateSensorDisplay(stationKey);
}

// --- 3. ฟังก์ชันแผนที่ (index.html) ---
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const map = L.map('map').setView([14.0145, 100.5332], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    Object.keys(stationsData).forEach(key => {
        const station = stationsData[key];
        const marker = L.marker(station.coords).addTo(map);
        
        const popupContent = `
            <div style="font-family: sans-serif; min-width: 160px;">
                <h4 style="color: #10b981; font-weight: bold; margin-bottom: 2px;">${station.name}</h4>
                <p style="font-size: 11px; color: #666; margin-bottom: 6px;">ต้องการวิเคราะห์แร่ธาตุและดินของแปลงนี้หรือไม่?</p>
                <button onclick="handleMapMarkerClick('${key}')" 
                        style="background-color: #10b981; color: white; border: none; padding: 6px 8px; font-size: 11px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">
                    🔍 ไปที่หน้าวิเคราะห์พืช
                </button>
            </div>
        `;
        marker.bindPopup(popupContent);
    });

    const selectEl = document.getElementById('station-select');
    if (selectEl) selectEl.value = localStorage.getItem('currentStationKey');
}

function handleMapMarkerClick(stationKey) {
    if (!stationKey) return;
    localStorage.setItem('currentStationKey', stationKey);
    window.location.href = 'analysis.html'; 
}

// --- 4. ข้อมูลอ้างอิงและเกณฑ์วิเคราะห์พืช (analysis.html) ---
const plantDatabase = {
    rice: {
        name: "ข้าว",
        optimal: { ph: 6.0, n: 50, p: 25, k: 100, moisture: 75 },
        getAdvices: (current) => [
            current.moisture < 75 ? { txt: `⚠️ ความชื้นต่ำไป (${current.moisture}%): ข้าวขาดน้ำ แนะนำให้ปล่อยน้ำเข้าแปลงเพิ่ม`, type: "error" } : { txt: "💧 ความชื้นเหมาะสมสำหรับการทำนา", type: "success" },
            current.n < 50 ? { txt: `🌱 ขาดไนโตรเจน (N มี ${current.n}/50): ควรเสริมปุ๋ยยูเรีย 46-0-0 เร่งการแตกกอ`, type: "warning" } : { txt: "✅ ปริมาณไนโตรเจน (N) เพียงพอแล้ว", type: "success" },
            current.ph < 5.5 ? { txt: `🛑 ดินเป็นกรดเกินไป (pH ${current.ph}): พืชดูดซึมปุ๋ยยาก แนะนำให้ใส่ปูนขาวปรับดิน`, type: "error" } : { txt: "👍 ค่ากรด-ด่างอยู่ในสภาวะสมดุล", type: "success" }
        ]
    },
    durian: {
        name: "ทุเรียน",
        optimal: { ph: 6.2, n: 60, p: 40, k: 150, moisture: 55 },
        getAdvices: (current) => [
            current.moisture > 70 ? { txt: `🚨 ชื้นแฉะเกินไป (${current.moisture}%): เสี่ยงเกิดโรครากเน่าโคนเน่า ต้องรีบระบายน้ำด่วน`, type: "error" } : { txt: "💧 ความชื้นในดินร่วนระบายน้ำได้ดีตามเกณฑ์", type: "success" },
            current.k < 150 ? { txt: `🍂 ขาดโพแทสเซียม (K มี ${current.k}/150): ควรใส่ปุ๋ยสูตรตัวท้ายสูง เช่น 0-0-60 บำรุงผล`, type: "warning" } : { txt: "✅ ระดับโพแทสเซียม (K) สมบูรณ์ดี", type: "success" },
            current.ph < 5.5 ? { txt: "⚠️ ดินเริ่มเป็นกรด: อาจส่งผลต่อการหาอาหารของรากทุเรียน", type: "warning" } : { txt: "✅ ค่ากรด-ด่างดินมีความเหมาะสมแล้ว", type: "success" }
        ]
    },
    cassava: {
        name: "มันสำปะหลัง",
        optimal: { ph: 5.5, n: 30, p: 20, k: 130, moisture: 40 },
        getAdvices: (current) => [
            current.moisture > 60 ? { txt: `⚠️ ชื้นสูงไป (${current.moisture}%): มันสำปะหลังชอบดินแห้ง ระวังหัวมันเน่าเสีย`, type: "warning" } : { txt: "💧 สภาพความชื้นพอดีต่อการสะสมแป้งและลงหัว", type: "success" },
            current.n > 40 ? { txt: `🌱 ไนโตรเจนสูงเกินไป (N มี ${current.n}/30): เสี่ยงอาการบ้าใบ ไม่ยอมลงหัว ควรงดปุ๋ยคอก`, type: "warning" } : { txt: "✅ ระดับแร่ธาตุ N อยู่ในเกณฑ์เหมาะสม", type: "success" }
        ]
    }
};

let analysisChart;

// --- 5. ฟังก์ชันประมวลผลกราฟและตารางเปรียบเทียบพืชทุกชนิด ---
function analyzePlant() {
    const selectElement = document.getElementById('plant-select');
    if (!selectElement) return;

    const selectedPlantKey = selectElement.value;
    const plant = plantDatabase[selectedPlantKey];
    
    const currentData = getCurrentSensorData();
    const activeStationKey = localStorage.getItem('currentStationKey') || 'A1';

    // พ่นค่าจริง 9 ค่าลงแถบด้านบนของหน้าวิเคราะห์พืช
    if (document.getElementById('val-ph')) {
        document.getElementById('val-ph').innerText = currentData.ph;
        document.getElementById('val-n').innerText = currentData.n + " mg/kg";
        document.getElementById('val-p').innerText = currentData.p + " mg/kg";
        document.getElementById('val-k').innerText = currentData.k + " mg/kg";
        document.getElementById('val-moisture').innerText = currentData.moisture + " %";
        document.getElementById('val-temp').innerText = currentData.temp + " °C";
        document.getElementById('val-ec').innerText = currentData.ec + " dS/m";
        document.getElementById('val-tds').innerText = currentData.tds + " ppm";
        document.getElementById('val-salinity').innerText = currentData.salinity + " g/L";
    }

    document.getElementById('target-plant-name').innerHTML = `${plant.name} <span class="text-sm font-normal text-gray-500">(ข้อมูลจากจุดตรวจวัด: ${activeStationKey})</span>`;

    // 📊 ส่วนจัดเรียงค่าเพื่อนำไปคำนวณสีกราฟแบบเฉพาะเจาะจง
    const labels = ['pH (x10)', 'Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Moisture (%)'];
    const currentValues = [currentData.ph * 10, currentData.n, currentData.p, currentData.k, currentData.moisture];
    const optimalValues = [plant.optimal.ph * 10, plant.optimal.n, plant.optimal.p, plant.optimal.k, plant.optimal.moisture];

    // 🎨 🔥 จุดเด่นใหม่: ลอจิกคำนวณสีของแต่ละแท่งแบบ Real-time ตามเกณฑ์ขาด/เกิน
    // สีเขียว (rgba(16, 185, 129)) = เหมาะสม
    // สีเหลืองส้ม (rgba(245, 158, 11)) = ต่ำกว่าเกณฑ์ (ขาดแร่ธาตุ)
    // สีแดง (rgba(239, 68, 68)) = สูงเกินเกณฑ์ หรือวิกฤต (เช่น กรดจัด/ชื้นจัด)
    const barColors = currentValues.map((val, index) => {
        const opt = optimalValues[index];
        
        if (index === 0) { // สีกราฟสำหรับค่า pH
            const realPh = val / 10;
            const targetPh = opt / 10;
            if (realPh < 5.5) return 'rgba(239, 68, 68, 0.85)'; // แดง (กรดจัด)
            if (Math.abs(realPh - targetPh) <= 0.5) return 'rgba(16, 185, 129, 0.85)'; // เขียว (สมดุล)
            return 'rgba(245, 158, 11, 0.85)'; // เหลือง
        }
        
        if (index === 4) { // สีกราฟสำหรับค่าความชื้น (Moisture)
            if (selectedPlantKey === 'durian' && val > 70) return 'rgba(239, 68, 68, 0.85)'; // แดง วิกฤตสำหรับทุเรียน
            if (val < opt - 15) return 'rgba(245, 158, 11, 0.85)'; // เหลือง ขาดน้ำ
            if (val > opt + 15) return 'rgba(239, 68, 68, 0.85)'; // แดง น้ำเกิน
            return 'rgba(16, 185, 129, 0.85)'; // เขียว พอดี
        }

        // สีกราฟสำหรับธาตุอาหาร N, P, K
        if (val < opt - 10) return 'rgba(245, 158, 11, 0.85)'; // เหลือง (ขาดปุ๋ย)
        if (val > opt + 40) return 'rgba(239, 68, 68, 0.85)'; // แดง (ปุ๋ยเกิน/บ้าใบ)
        return 'rgba(16, 185, 129, 0.85)'; // เขียว (พอดีเกณฑ์)
    });

    const borderColors = barColors.map(color => color.replace('0.85', '1'));

    if (analysisChart) { analysisChart.destroy(); }

    const ctx = document.getElementById('analysisChart').getContext('2d');
    analysisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: `ค่าจริงแปลง ${activeStationKey} (สีส้ม=ขาด / สีแดง=วิกฤต-เกิน / สีเขียว=ดี)`, 
                    data: currentValues, 
                    backgroundColor: barColors, // พ่นอาเรย์สีแบบไดนามิกที่คำนวณไว้
                    borderColor: borderColors, 
                    borderWidth: 1.5 
                },
                { 
                    label: `เส้นเกณฑ์มาตรฐานของ ${plant.name}`, 
                    data: optimalValues, 
                    backgroundColor: 'rgba(156, 163, 175, 0.25)', 
                    borderColor: 'rgb(107, 114, 128)', 
                    borderWidth: 1, 
                    borderDash: [5, 5] 
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true } } 
        }
    });

    // 📋 ส่วนที่ 2: แสดงวิเคราะห์ "สิ่งที่ขาด/เกิน" ของพืชหลัก
    const recListDiv = document.getElementById('recommendation-list');
    recListDiv.innerHTML = ''; 
    plant.getAdvices(currentData).forEach(adv => {
        let bgClass = adv.type === "error" ? "bg-red-50 border-red-100 text-red-800" : (adv.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-emerald-50 border-emerald-100 text-emerald-800");
        recListDiv.innerHTML += `<div class="p-3 border rounded-xl ${bgClass}"><span>${adv.txt}</span></div>`;
    });

    // 📊 ส่วนที่ 3: ตารางเปรียบเทียบพืชชนิดอื่นๆ ทั้งหมดในระบบ
    const compareTableBody = document.getElementById('compare-table-body');
    if (compareTableBody) {
        compareTableBody.innerHTML = ''; 
        Object.keys(plantDatabase).forEach(key => {
            const p = plantDatabase[key];
            let matchStatus = "🟢 เหมาะสมสูง";
            if (Math.abs(currentData.ph - p.optimal.ph) > 1.0 || Math.abs(currentData.moisture - p.optimal.moisture) > 20) {
                matchStatus = "🔴 ไม่เหมาะสม";
            } else if (currentData.n < p.optimal.n - 15) {
                matchStatus = "🟡 เหมาะสมปานกลาง (ขาดปุ๋ย)";
            }

            const row = `
                <tr class="border-b border-gray-100 hover:bg-gray-50 text-center text-sm">
                    <td class="p-3 text-left font-medium text-gray-700">${p.name}</td>
                    <td class="p-3 text-gray-500">${p.optimal.ph}</td>
                    <td class="p-3 text-gray-500">${p.optimal.n}</td>
                    <td class="p-3 text-gray-500">${p.optimal.p}</td>
                    <td class="p-3 text-gray-500">${p.optimal.k}</td>
                    <td class="p-3 text-gray-500">${p.optimal.moisture}%</td>
                    <td class="p-3 font-semibold">${matchStatus}</td>
                </tr>
            `;
            compareTableBody.innerHTML += row;
        });
    }
}