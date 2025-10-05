import { getDatabase, ref as dbRef, push, onChildAdded, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();

export function initTicTacToe(chatId){
  const boardEl = document.getElementById('ttt-board');
  const statusEl = document.getElementById('ttt-status');
  const resetBtn = document.getElementById('ttt-reset-btn');
  boardEl.innerHTML='';
  for(let i=0;i<9;i++){ const b=document.createElement('button'); b.className='ttt-cell'; b.dataset.index=i; boardEl.appendChild(b); }

  const tttRef = dbRef(db, 'privateMessages/'+chatId+'/tttMoves');

  resetBtn.onclick=async()=>{
    await set(tttRef,null);
  }

  onChildAdded(tttRef,s=>{
    const m=s.val();
    const cell=boardEl.querySelector(`.ttt-cell[data-index='${m.index}']`);
    if(cell)cell.textContent=m.symbol;
    // optional: checkWinner function
  });

  boardEl.addEventListener('click',async(e)=>{
    const cell=e.target;
    if(!cell.classList.contains('ttt-cell')||cell.textContent) return;
    const currentUid = auth.currentUser.uid;
    let symbol='X';
    const cells = boardEl.querySelectorAll('.ttt-cell');
    let moves=0; cells.forEach(c=>{if(c.textContent!=='')moves++;});
    if(moves%2===1)symbol='O';
    await push(tttRef,{index:cell.dataset.index,playerUid:currentUid,symbol});
  });
}
