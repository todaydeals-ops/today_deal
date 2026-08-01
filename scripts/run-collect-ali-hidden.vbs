' 창 없이(숨김) collect-ali 실행. 작업 스케줄러가 이 vbs를 호출.
CreateObject("WScript.Shell").Run "cmd /c node ""C:\Users\user\Desktop\today_deal\scripts\collect-ali.mjs"" >> ""C:\Users\user\Desktop\today_deal\scripts\collect-ali.log"" 2>&1", 0, False
