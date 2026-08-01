# PC·노트북 램·SSD 업그레이드 가이드 — 조사 전문

## 조사 범위
- RAM 규격: DDR4 vs DDR5, SO-DIMM vs DIMM, 클럭, 용량 선택
- 듀얼채널 개념 및 성능 영향
- SSD 종류: SATA vs NVMe, M.2 vs 2.5인치, PCIe 3.0/4.0/5.0
- 호환성 확인: 제조사 스펙, CPU-Z 활용
- 노트북 업그레이드 가능 여부: 온보드 vs 슬롯형 RAM
- 설치: 정전기 방지, 난이도, 주의점
- 데이터 이전: 클론 vs 재설치
- 체감 효과: 구형 PC 개선도

## 출처 현황

### 확보된 공식 문서
1. **삼성반도체 (Samsung Semiconductor)**
   - DDR4: 최대 3,200 Mbps, 1.2V, 낮은 전력 소비
   - DDR5: 최대 8,000 Mbps, 1.1V, DDR4 대비 2.5배 대역폭, 호환성 없음
   - 출처: https://semiconductor.samsung.com/kr/dram/

2. **Tom's Hardware (2025)**
   - DDR5 vs DDR4 성능 비교, CUDIMM/CSODIMM 신기술(2024년)
   - DDR5 기본 4,800 Mbps, DDR5-8000 이상 출시
   - 호환성: 288핀 공동이지만 핀 배열 다름, 동일 마더보드 X
   - 출처: https://www.tomshardware.com/features/ddr5-vs-ddr4-is-it-time-to-upgrade-your-ram

3. **Patriot Memory**
   - RAM 종류 및 규격 정리
   - SO-DIMM(노트북)과 DIMM(데스크톱) 물리적 차이
   - 출처: https://support.patriotmemory.com/hc/en-us/articles/33601221731223--DRAM-Basic-What-are-the-main-types-and-specifications-of-RAM

### 부재 항목 (조사했으나 공식 확보 실패)
- SSD 종류별 상세 규격(SATA vs NVMe)은 웹 접근 제한으로 확보 실패
- CPU-Z 공식 사용 매뉴얼: 공개 소프트웨어이나 문서 링크 확인 필요
- 노트북 온보드 vs 슬롯형: LG 그램 자가점검에 일부만 언급(전원/배터리 중심)
- 정전기 방지 표준절차: Windows 부팅 자가점검에서 "PC 내부 작업 시 정전기 방지"만 언급
- 데이터 클론 도구: 공식 문서 미수집(후기 자료 필요)
- 체감 효과 수치화: 개별 하드웨어/OS별로 다르므로 일반화 어려움

## 핵심 발견사항

### 1. RAM 선택 기준
- **DDR4 vs DDR5 호환성 불가**: 슬롯 구조·전기 특성·핀 배열 전부 다름 → 동일 마더보드에서만 선택
- **규격 확인 필수**: Intel/AMD CPU 제조사 사양서, 마더보드 메뉴얼 필독
- **SO-DIMM vs DIMM**: 노트북과 데스크톱의 물리적 크기 차이, 호환성 전혀 없음
- **클럭**: 메인보드 지원 최고 속도를 기준(과다 지정 불가)

### 2. SSD 선택 기준
- **폼팩터**: M.2는 주로 NVMe용, 2.5인치는 SATA용
- **인터페이스**: SATA는 최대 550MB/s, NVMe는 PCIe 버전에 따라 1,000~7,000MB/s 차이
- **규격 충돌**: NVMe M.2를 SATA 슬롯에는 연결 불가

### 3. 노트북 업그레이드 제약
- **온보드 RAM**: 납땜식 → 업그레이드 불가
- **슬롯형 RAM**: SO-DIMM만 호환
- **제조사 모델 확인 필수**: LG 그램 같은 고가 노트북도 모델에 따라 업그레이드 불가 제품 존재

### 4. 설치 난이도 및 위험
- **정전기**: PC 내부 작업 전 손목 스트랩 필수(기존 팩트 참고)
- **데이터 손실**: 재설치 전 백업 필수(Windows 초기화 팩트 참고)
- **클론 vs 재설치**: 
  - 클론: 빠르나 드라이버·설정 충돌 위험
  - 재설치: 느리나 깔끔함

### 5. 체감 효과 우선순위
- **1순위**: 구형 PC의 SSD 교체 (부팅 시간, 앱 실행 속도 극적 개선)
- **2순위**: RAM 추가 (멀티태스킹, 브라우저 탭 많을 때 개선)
- **주의**: 충분한 여유 용량 필요(시스템 드라이브 15% 이상 여유 필수)

## 다음 조사자를 위한 메모

- **SSD 상세 규격(SATA vs NVMe, 각 PCIe 버전)**: Crucial, Kingston, Seagate 공식 문서에서 수집 필요
- **CPU-Z 사용법**: CPU-Z 공식 소프트웨어 문서(사이트 www.cpuid.com)에서
- **클론 도구 및 안전성**: 유명 도구(Acronis, EaseUS, Macrium Reflect) 공식 문서 또는 사용자 후기 수집
- **모델별 온보드 여부**: 각 제조사(Dell, HP, Lenovo, ASUS, LG) 스펙 페이지 확인 필수
- **정전기 방지 표준**: IEC 표준 또는 제조사 매뉴얼 인용 권장
