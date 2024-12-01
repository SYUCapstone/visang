/* global naver */
import React, { useEffect, useRef, useState } from "react";

const EmergencyHospitalMap = () => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const markers = useRef([]);
    const [filter, setFilter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stage2, setStage2] = useState("강남구");

    const filterMapping = {
        CT: "hvctayn",
        MRI: "hvmriayn",
        VENTI: "hvventiayn",
        INCUBATOR: "hv11",
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            alert("Geolocation을 지원하지 않는 브라우저입니다.");
        }
    };

    const showPosition = (position) => {
        //const { latitude, longitude } = position.coords;
        const latitude = 37.65146111; // 테스트용 위도
        const longitude = 127.0583889; // 테스트용 경도
        const location = new naver.maps.LatLng(latitude, longitude);

        if (!mapRef.current) {
            mapRef.current = new naver.maps.Map("map", {
                center: location,
                zoom: 10,
            });
        }

        if (!markerRef.current) {
            markerRef.current = new naver.maps.Marker({
                position: location,
                map: mapRef.current,
                title: "현재 위치",
            });
        } else {
            markerRef.current.setPosition(location);
        }

        mapRef.current.setCenter(location);
        reverseGeocode(latitude, longitude);
        fetchHospitalData(latitude, longitude);
    };

    const reverseGeocode = async (latitude, longitude) => {
        const coords = `${longitude},${latitude}`;  // 경도, 위도를 "경도,위도" 형식으로 합침
        const geocodingUrl = `http://localhost:3001/api/reverse-geocode?coords=${coords}`;
        console.log("Reverse Geocoding URL:", geocodingUrl);
        console.log("coords:", `${longitude},${latitude}`);

        try {
            const response = await fetch(geocodingUrl);
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.text();  // XML 형식이므로 text()로 받음
            console.log("Reverse Geocode Data:", data);
    
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
    
            const resultNode = xmlDoc.getElementsByTagName("result")[0];
            if (resultNode) {
                const addrNode = resultNode.getElementsByTagName("addr")[0];
                if (addrNode) {
                    const district = addrNode.textContent;  // 주소 내용
                    setStage2(district);  // 시군구 정보 추출 후 상태 업데이트
                    return;
                }
            }
    
        } catch (error) {
            console.error("Reverse Geocoding 실패:", error);
        }
    };
    
    

    const fetchHospitalData = async (latitude, longitude) => {
        setLoading(true);

        const baseApiUrl = filter
            ? "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire"
            : "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytLcinfoInqire";

        const queryParams = filter
            ? `&STAGE1=서울특별시&STAGE2=${stage2}&${filterMapping[filter]}=Y`
            : `&WGS84_LON=${longitude}&WGS84_LAT=${latitude}`;

        const apiUrl = `${baseApiUrl}?serviceKey=ABFtCvcDAGqJVnVeX9v0ajxRpRfRq5Yyb%2B8wPnZ0zYWKNfy8VVGudOCd8QYzvRYW%2BRuwv5mEZ9GixK6Cep6nXw%3D%3D&pageNo=1&numOfRows=528${queryParams}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            const hospitals = xmlDoc.getElementsByTagName("item");

            displayHospitals(hospitals);
        } catch (error) {
            console.error("병원 데이터를 가져오는 데 실패했습니다:", error);
            alert("병원 데이터를 가져오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const displayHospitals = (hospitals) => {
        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = [];

        Array.from(hospitals).forEach((hospital) => {
            const latitudeNode = hospital.getElementsByTagName("latitude")[0];
            const longitudeNode = hospital.getElementsByTagName("longitude")[0];
            const nameNode = hospital.getElementsByTagName("dutyName")[0];

            if (!latitudeNode || !longitudeNode || !nameNode) return;

            const lat = parseFloat(latitudeNode.textContent);
            const lon = parseFloat(longitudeNode.textContent);
            const name = nameNode.textContent;

            const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(lat, lon),
                map: mapRef.current,
                title: name,
            });

            markers.current.push(marker);

            naver.maps.Event.addListener(marker, "click", () => alert(name));
        });
    };

    const showError = (error) => {
        const errorMessage = {
            1: "사용자가 위치 정보 제공을 거부했습니다.",
            2: "위치 정보를 사용할 수 없습니다.",
            3: "위치 정보를 가져오는 데 시간이 초과되었습니다.",
        };
        alert(errorMessage[error.code] || "알 수 없는 오류가 발생했습니다.");
    };

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=y800ba3o9m";
        script.onload = getLocation;
        document.head.appendChild(script);
    }, [filter]);

    return (
        <div>
            <h1>응급의료기관 정보</h1>
            <div style={{ marginBottom: "10px" }}>
                <button onClick={() => setFilter("CT")} disabled={loading}>
                    CT
                </button>
                <button onClick={() => setFilter("MRI")} disabled={loading}>
                    MRI
                </button>
                <button onClick={() => setFilter("VENTI")} disabled={loading}>
                    소아
                </button>
                <button onClick={() => setFilter("INCUBATOR")} disabled={loading}>
                    인큐베이터
                </button>
            </div>
            <div id="map" style={{ width: "100%", height: "500px" }}></div>
        </div>
    );
};

export default EmergencyHospitalMap;
