import { getDatabase, ref as dbRef, push, onChildAdded, onValue, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const auth = getAuth();
const db = getDatabase();

function checkWinnerFromArray(cells){
  const winLines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for(const line of winLines){
    const [a,b,c] = line;
    if(cells[a] && cells[a] === cells[b] && cells[a] === cells[c]){
      return { winner: cells[a], line };
    }
  }
  if(cells.every(x => x)) return { winner: 'draw' };
  return null;
}

export function initTicTacToe(chatId){
  if(!chatId) return;
  const boardEl = document.getElementById('ttt-board');
  const statusEl = document.getElementById('ttt-status');
  const resetBtn = document.getElementById('ttt-reset-btn');
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const btn = document.createElement('button');
    btn.className = 'ttt-cell';
    btn.dataset.index = i;
    btn.textContent = '';
    boardEl.appendChild(btn);
  }

  const tttRef = dbRef(db, 'privateMessages/' + chatId + '/tttMoves');

  onChildAdded(tttRef, snapshot => {
    const m = snapshot.val();
    const idx = Number(m.index);
    const cell = boardEl.querySelector(`.ttt-cell[data-index="${idx}"]`);
    if(cell) cell.textContent = m.symbol || '';
    updateStatusFromCells();
  });

  onValue(tttRef, snap => {
    if(!snap.exists()){
      boardEl.querySelectorAll('.ttt-cell').forEach(c=>{ c.textContent=''; c.style.boxShadow=''; });
      statusEl.textContent = 'Waiting for opponent...';
    }
  });

  function getCellsArray(){
    return Array.from(boardEl.querySelectorAll('.ttt-cell')).map(c => c.textContent || '');
  }

  function updateStatusFromCells(){
    const cells = getCellsArray();
    const result = checkWinnerFromArray(cells);
    if(result){
      if(result.winner === 'draw'){
        statusEl.textContent = 'Draw!';
      }else{
        statusEl.textContent = result.winner + ' wins!';
        if(result.line && result.line.length===3){
          boardEl.querySelectorAll('.ttt-cell').forEach((c, i) => {
            if(result.line.includes(i)) c.style.boxShadow = '0 0 0 3px rgba(0,150,0,0.12)';
          });
        }
      }
    }else{
      const xCount = cells.filter(x=>x==='X').length;
      const oCount = cells.filter(x=>x==='O').length;
      const next = xCount <= oCount ? 'X' : 'O';
      statusEl.textContent = next + "'s turn";
    }
  }

  boardEl.addEventListener('click', async (e) => {
    const target = e.target;
    if(!target.classList.contains('ttt-cell')) return;
    if(target.textContent) return;
    const user = auth.currentUser;
    if(!user){
      alert('Please sign in to play');
      return;
    }
    const cells = getCellsArray();
    const xCount = cells.filter(x=>x==='X').length;
    const oCount = cells.filter(x=>x==='O').length;
    const symbol = xCount <= oCount ? 'X' : 'O';
    await push(tttRef, { index: target.dataset.index, playerUid: user.uid, symbol, timestamp: Date.now() });
  });

  resetBtn.onclick = async () => {
    await set(tttRef, null);
    boardEl.querySelectorAll('.ttt-cell').forEach(c=>{ c.textContent=''; c.style.boxShadow=''; });
    statusEl.textContent = 'Waiting for opponent...';
  };

  statusEl.textContent = 'Waiting for opponent...';
}
