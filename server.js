require('dotenv').config(); // .env 파일 로드
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:3000" }));

app.use((req, res, next) => {
    console.log(`요청: ${req.method} ${req.url}`);
    next();
});

app.get('/api/reverse-geocode', async (req, res) => {
    const { coords } = req.query;

    if (!coords) {
        return res.status(400).json({ error: "coords 파라미터가 필요합니다." });
    }

    const [lon, lat] = coords.split(','); // 쉼표로 분리
    if (!lon || !lat || isNaN(lon) || isNaN(lat)) {
        return res.status(400).json({ error: "coords 값이 잘못되었습니다. '경도,위도' 형식이어야 합니다." });
    }

    console.log(`Received coords: lon=${lon}, lat=${lat}`);

    // 네이버 API로 요청 보내기 (예: axios 사용)
    try {
        const response = await axios.get(
            `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc`,
            {
                params: {
                    request: 'coordsToaddr',
                    coords: `${lon},${lat}`,
                    sourcecrs: 'epsg:4326',
                    orders: 'admcode,legalcode,addr,roadaddr',
                    output: 'xml',
                },
                headers: {
                    'X-NCP-APIGW-API-KEY-ID': 'y800ba3o9m',
                    'X-NCP-APIGW-API-KEY': 'lYlIMa5XPQM6UGvtbGbTHJXuPKcomaBJS1IQguzj',
                },
            }
        );

        res.send(response.data); // 네이버 API 응답 반환
    } catch (error) {
        console.error("Reverse Geocoding API 요청 실패:", error.message);
        res.status(500).json({ error: "Reverse Geocoding API 요청 실패" });
    }
});


app.get('/api/hospitals', async (req, res) => {
    try {
        const url = 'https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire';
        const params = {
            serviceKey: process.env.API_SERVICE_KEY, // 환경 변수 사용
        };
        
        const response = await axios.get(url, { params, timeout: 10000 });
        const hospitals = response.data?.response?.body?.items?.item;

        if (!hospitals) {
            console.error("API 응답 데이터에 items가 없습니다:", response.data);
            return res.status(500).send("API 응답에 오류가 있습니다.");
        }

        console.log("추출된 병원 데이터:", hospitals);
        res.json(hospitals); // JSON 형식으로 응답
    } catch (error) {
        console.error("API 요청 에러:", error.message);
        res.status(500).send("서버 오류가 발생했습니다.");
    }
});

app.listen(PORT, () => {
    console.log(`프록시 서버가 포트 ${PORT}에서 실행 중입니다`);
});
