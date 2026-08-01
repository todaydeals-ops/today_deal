' 오늘의딜 크롤러를 창 없이(숨김) 실행. 작업 스케줄러가 이 vbs를 호출.
CreateObject("WScript.Shell").Run "cmd /c ""C:\Users\user\Desktop\today_deal\crawler\run-crawler.cmd""", 0, False
