' 가격비교 배치를 창 없이(숨김) 실행. 작업 스케줄러가 이 vbs를 호출.
' 경로를 박지 않는다 — 자기 위치를 스스로 찾는다.
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c """ & here & "\run-price-compare.cmd""", 0, False
