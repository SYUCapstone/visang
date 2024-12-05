require('dotenv').config(); // .env 파일 로드
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mysql = require("mysql");
const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:3000" }));

app.use((req, res, next) => {
    console.log(`요청: ${req.method} ${req.url}`);
    next();
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "0000", // 비밀번호
    database: "hospital_db",
});

db.connect((err) => {
    if (err) {
        console.error("MySQL 연결 오류:", err);
        return;
    }
    console.log("MySQL에 연결되었습니다.");
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
});


app.get('/api/hospitals', async (req, res) => {
    const query = "SELECT * FROM hospitals";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("데이터 조회 오류:", err);
            res.status(500).send("서버 오류");
            return;
        }
        res.json(results); // JSON 형식으로 데이터 반환
    });
});

app.listen(PORT, () => {
    console.log(`프록시 서버가 포트 ${PORT}에서 실행 중입니다`);
});
