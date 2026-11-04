let mouseStartState = null;
let isDragging = false;
let dragMode = "";
let dragAction = "";

let startCell = null;
let lastCell = null;
let hasMoved = false;

// 마우스 버튼을 누를 때
function handleMouse(event, cell) {

    if (event.button === 0) {
        dragMode = "filled";
    }
    else if (event.button === 2) {
        dragMode = "cross";
    }
    else {
        return;
    }

    event.preventDefault();

    isDragging = true;
    hasMoved = false;
    
    // 마우스 작업 시작 전 상태 기억
    mouseStartState = getBoardState();

    startCell = cell;
    lastCell = cell;

    // 시작 칸 상태에 따라 작업 결정
    if (cell.classList.contains(dragMode)) {
        dragAction = "erase";
    }
    else {
        dragAction = "paint";
    }

    selectCell(cell);
}

// 드래그 중 다른 칸에 들어갈 때
function handleMouseOver(cell) {

    if (!isDragging) {
        return;
    }

    if (cell === lastCell) {
        return;
    }

    hasMoved = true;
    lastCell = cell;

    // 오른쪽 드래그가 시작되면
    // 시작 칸에도 드래그 규칙 적용
   if (startCell !== null) {
        applyCell(startCell);
        startCell = null;
    }

    applyCell(cell);
    selectCell(cell);
}

// 칸 상태 변경

function applyCell(cell) {

    // 지우기 작업
    if (dragAction === "erase") {
        cell.classList.remove(dragMode);
        return;
    }

    // 왼쪽 드래그: X 표시된 칸 보호
    if (
        dragMode === "filled" &&
        cell.classList.contains("cross")
    ) {
        return;
    }

    // 오른쪽 드래그: 검은색 칸 보호
    if (
        dragMode === "cross" &&
        cell.classList.contains("filled")
    ) {
        return;
    }

    // 색칠 또는 X 표시
    cell.classList.remove("filled", "cross");
    cell.classList.add(dragMode);
}


// 마우스 버튼을 놓을 때

document.addEventListener("mouseup", function(event) {

    if (!isDragging) {
        return;
    }

    // 단일 클릭 처리
    if (
        !hasMoved &&
        startCell !== null &&
        event.target === startCell &&
        (
            (dragMode === "filled" && event.button === 0) ||
            (dragMode === "cross" && event.button === 2)
        )
    ) {
        // 같은 표시를 클릭하면 제거
        if (dragAction === "erase") {
            startCell.classList.remove(dragMode);
        }
        else {
            // 단일 클릭은 다른 표시를 덮어쓸 수 있음
            startCell.classList.remove("filled", "cross");
            startCell.classList.add(dragMode);
        }
    }
    
    // 작업 전후 상태 비교
    let mouseEndState = getBoardState();

    if (
        mouseStartState !== null &&
        JSON.stringify(mouseStartState) !==
        JSON.stringify(mouseEndState)
    ) {
        undoStack.push(mouseStartState);
        redoStack = [];
    }

    mouseStartState = null;

    // 마우스 작업 초기화
    isDragging = false;
    startCell = null;
    lastCell = null;
    hasMoved = false;
});



// 게임판의 모든 칸 가져오기
let cells = document.querySelectorAll(".cell");

// 실행 취소 및 다시 실행 기록
let undoStack = [];
let redoStack = [];

// 현재 게임판 상태 가져오기
function getBoardState() {

    return Array.from(cells).map(function(cell) {

        if (cell.classList.contains("filled")) {
            return "filled";
        }

        if (cell.classList.contains("cross")) {
            return "cross";
        }

        return "";
    });
}

// 저장된 게임판 상태 복원하기
function restoreBoardState(state) {

    cells.forEach(function(cell, index) {

        cell.classList.remove("filled", "cross");

        if (state[index] !== "") {
            cell.classList.add(state[index]);
        }
    });
}

// 작업 전 상태 저장
function saveHistory() {

    undoStack.push(getBoardState());

    // 새로운 작업을 하면 다시 실행 기록 제거
    redoStack = [];
}

// 실행 취소
function undoAction() {

    if (undoStack.length === 0) {
        return;
    }

    redoStack.push(getBoardState());

    let previousState = undoStack.pop();

    restoreBoardState(previousState);
}

// 다시 실행
function redoAction() {

    if (redoStack.length === 0) {
        return;
    }

    undoStack.push(getBoardState());

    let nextState = redoStack.pop();

    restoreBoardState(nextState);
}

// 현재 선택된 칸 번호
let selectedIndex = 12;

// Shift 선택 시작 위치
let selectionStart = selectedIndex;

// 선택된 칸 번호 저장
let selectedCells = new Set();

// 선택 영역 표시
function updateSelection() {

    // 기존 선택 영역 제거
    cells.forEach(function(cell) {
        cell.classList.remove("range-selected");
    });

    selectedCells.clear();

    let startRow = Math.floor(selectionStart / 5);
    let startCol = selectionStart % 5;

    let endRow = Math.floor(selectedIndex / 5);
    let endCol = selectedIndex % 5;

    // 직사각형 범위 계산
    for (
        let row = Math.min(startRow, endRow);
        row <= Math.max(startRow, endRow);
        row++
    ) {
        for (
            let col = Math.min(startCol, endCol);
            col <= Math.max(startCol, endCol);
            col++
        ) {
            let index = row * 5 + col;

            selectedCells.add(index);
            cells[index].classList.add("range-selected");
        }
    }
}

// 선택 영역 초기화
function clearSelection() {

    selectedCells.clear();

    cells.forEach(function(cell) {
        cell.classList.remove("range-selected");
    });

    selectionStart = selectedIndex;
}

// 선택된 칸 변경
function selectCell(cell) {

    // 기존 선택 표시 제거
    cells[selectedIndex].classList.remove("selected");

    // 클릭한 칸의 번호 찾기
    let newIndex = Array.from(cells).indexOf(cell);

    // 유효한 칸인지 확인
    if (newIndex === -1) {
        cells[selectedIndex].classList.add("selected");
        return;
    }

    // 선택 번호 변경
    selectedIndex = newIndex;

    // 새로운 선택 표시 적용
    cells[selectedIndex].classList.add("selected");

    // 키보드 선택 영역 초기화
    clearSelection();   
}


// 시작 칸 선택
cells[selectedIndex].classList.add("selected");



/* 키보드 연속 작업 관리 */

let keyboardMode = "";
let keyboardAction = "";
let keyboardStartState = null;
let keyboardMoved = false;

// 게임판 변경 기록 확정
function finishKeyboardAction() {

    if (keyboardMode === "") {
        return;
    }

    // 방향키 이동 없이 키를 놓았다면 단일 입력
    if (!keyboardMoved) {
        let cell = cells[selectedIndex];

        if (keyboardAction === "erase") {
            cell.classList.remove(keyboardMode);
        }
        else {
            cell.classList.remove("filled", "cross");
            cell.classList.add(keyboardMode);
        }
    }

    // 작업 전후 상태가 실제로 달라졌는지 확인
    let newState = getBoardState();

    if (
        JSON.stringify(keyboardStartState) !==
        JSON.stringify(newState)
    ) {
        undoStack.push(keyboardStartState);
        redoStack = [];
    }

    // 키보드 작업 초기화
    keyboardMode = "";
    keyboardAction = "";
    keyboardStartState = null;
    keyboardMoved = false;
}

// 연속 작업으로 칸 변경

function applyKeyboardCell(cell) {

    // 지우기 작업
    if (keyboardAction === "erase") {
        cell.classList.remove(keyboardMode);
        return;
    }

    // Space 연속 색칠 중 X 표시된 칸 보호
    if (
        keyboardMode === "filled" &&
        cell.classList.contains("cross")
    ) {
        return;
    }

    // X 연속 표시 중 검은색 칸 보호
    if (
        keyboardMode === "cross" &&
        cell.classList.contains("filled")
    ) {
        return;
    }

    // 기존 상태 제거 후 새 상태 적용
    cell.classList.remove("filled", "cross");
    cell.classList.add(keyboardMode);
}


// 키보드 누르기
document.addEventListener("keydown", function(event) {

    let key = event.key.toLowerCase();

    // 실행 취소
    if (event.ctrlKey && key === "z") {
        event.preventDefault();

        if (event.repeat) return;

        finishKeyboardAction();
        undoAction();
        return;
    }

    // 다시 실행
    if (event.ctrlKey && key === "y") {
        event.preventDefault();

        if (event.repeat) return;

        finishKeyboardAction();
        redoAction();
        return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    // Space 또는 X 누르기
    if (key === " " || key === "x") {

        event.preventDefault();

        // 키 반복 입력 방지
        if (event.repeat) return;

        // 다른 작업이 진행 중이면 무시
        if (keyboardMode !== "") return;

        keyboardMode = key === " " ? "filled" : "cross";

        keyboardStartState = getBoardState();
        keyboardMoved = false;

        // 시작 칸 상태로 칠하기/지우기 결정
        if (cells[selectedIndex].classList.contains(keyboardMode)) {
            keyboardAction = "erase";
        }
        else {
            keyboardAction = "paint";
        }

        return;
    }

    // 방향키가 아니면 종료
    if (!event.key.startsWith("Arrow")) {
        return;
    }

    event.preventDefault();

    let newIndex = selectedIndex;

    if (event.key === "ArrowUp" && selectedIndex >= 5) {
        newIndex -= 5;
    }
    else if (event.key === "ArrowDown" && selectedIndex < 20) {
        newIndex += 5;
    }
    else if (
        event.key === "ArrowLeft" &&
        selectedIndex % 5 !== 0
    ) {
        newIndex -= 1;
    }
    else if (
        event.key === "ArrowRight" &&
        selectedIndex % 5 !== 4
    ) {
        newIndex += 1;
    }

    // 이동할 수 없는 경우
    if (newIndex === selectedIndex) {
        return;
    }

    // 연속 작업 중 첫 이동
    if (keyboardMode !== "" && !keyboardMoved) {
        keyboardMoved = true;

        // 시작 칸에도 연속 작업 규칙 적용
        applyKeyboardCell(cells[selectedIndex]);
    }

    // 선택 위치 이동
    cells[selectedIndex].classList.remove("selected");

    selectedIndex = newIndex;

    cells[selectedIndex].classList.add("selected");

    // 연속 작업 중이면 이동한 칸 변경
    if (keyboardMode !== "") {
        applyKeyboardCell(cells[selectedIndex]);
    }

    // 이전 Shift 선택 영역 제거
    clearSelection();
});

// Space 또는 X를 놓았을 때
document.addEventListener("keyup", function(event) {

    let key = event.key.toLowerCase();

    if (
        (key === " " && keyboardMode === "filled") ||
        (key === "x" && keyboardMode === "cross")
    ) {
        finishKeyboardAction();
    }
});

// 브라우저 창에서 포커스가 사라질 때 작업 종료
window.addEventListener("blur", function() {
    finishKeyboardAction();
});
