' 창 없이(숨김) collect-ali 실행. 작업 스케줄러가 이 vbs를 호출.
' 경로를 박지 않는다 — 자기 위치를 스스로 찾는다.
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c node """ & here & "\collect-ali.mjs"" >> """ & here & "\collect-ali.log"" 2>&1", 0, False
