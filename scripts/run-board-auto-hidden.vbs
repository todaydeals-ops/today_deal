' 창 없이(숨김) board-auto 실행. 작업 스케줄러가 이 vbs를 호출.
' 경로를 박지 않는다 — 자기 위치를 스스로 찾는다.
' 2026-08-13 프로젝트를 D 드라이브로 옮기면서, 절대경로가 박혀 있으면
' 작업은 "성공"으로 뜨는데 안에서 조용히 실패한다는 걸 겪었다.
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c """ & here & "\run-board-auto.cmd""", 0, False
