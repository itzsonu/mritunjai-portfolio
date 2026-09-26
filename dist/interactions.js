(() => {
  'use strict';
  const games = [];
  const tabs = [...document.querySelectorAll('[role="tab"][data-panel]')];
  function selectTab(tab) {
    games.forEach(game => game.stop());
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if(event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if(event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if(event.key === 'Home') next = 0;
      if(event.key === 'End') next = tabs.length - 1;
      if(next !== undefined) { event.preventDefault(); selectTab(tabs[next]); tabs[next].focus(); }
    });
  });

  document.querySelectorAll('[data-demo="milestones"]').forEach(root => {
    const items = [...root.querySelectorAll('[data-milestone]')];
    const action = root.querySelector('[data-action="milestone"]');
    const feedback = root.querySelector('[data-feedback]');
    let approved = 0, submitted = false;
    function render() {
      items.forEach((item,index) => {
        const status = index < approved ? 'Approved' : index > approved ? 'Locked' : submitted ? 'In review' : 'Active';
        item.dataset.status = status;
        item.querySelector('.step-status').textContent = status;
      });
      root.querySelector('[data-progress]').textContent = `${approved} / 3 approved`;
      action.disabled = approved === 3;
      action.textContent = approved === 3 ? 'Project complete ✓' : submitted ? 'Approve as client ✓' : 'Submit work as freelancer ↗';
    }
    action.addEventListener('click', () => {
      if(approved === 3) return;
      const name = items[approved].querySelector('strong').textContent;
      if(!submitted) {
        submitted = true;
        feedback.textContent = `${name} submitted. Switch hats: approve it as the client to unlock the next step.`;
      } else {
        submitted = false; approved++;
        feedback.textContent = approved === 3 ? 'All three milestones approved. The sample project is complete.' : `${name} approved. ${items[approved].querySelector('strong').textContent} is now unlocked.`;
      }
      render();
    });
    root.querySelector('[data-action="reset"]').addEventListener('click', () => {
      approved = 0; submitted = false; render(); feedback.textContent = 'Demo reset. Design direction is ready for submission.';
    });
    render();
  });

  const cloud = [
    ['THE DEFINITION','Bicep template','Describes the storage resources in code. Parameters make the region, account name, container name and storage SKU configurable.',"targetScope = 'resourceGroup'\nparam storageAccountName string\nparam containerName string = 'data'",'One definition, configurable deployments.'],
    ['THE ACCOUNT','Storage account','The top-level storage resource in this template. It uses StorageV2, a configurable SKU and the selected Azure region.',"kind: 'StorageV2'\nsku: { name: storageSku }\nlocation: location",'A named home for the storage services.'],
    ['THE SERVICE','Blob service','The default blob service belongs to the storage account. Bicep expresses this relationship through the parent property.',"name: 'default'\nparent: storageAccount",'The dependency is part of the resource definition.'],
    ['THE CONTAINER','Private container','The container belongs to the blob service. Its publicAccess setting is None, so anonymous public access is disabled for this container.',"name: containerName\nparent: blobService\nproperties: { publicAccess: 'None' }",'Access must be authorized; this is not an anonymous public container.']
  ];
  document.querySelectorAll('[data-demo="cloud"]').forEach(root => {
    root.querySelectorAll('[data-cloud]').forEach(button => button.addEventListener('click', () => {
      root.querySelectorAll('[data-cloud]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      const data = cloud[Number(button.dataset.cloud)];
      ['label','title','description','code','takeaway'].forEach((field,i) => root.querySelector(`[data-cloud-${field}]`).textContent = data[i]);
    }));
  });

  document.querySelectorAll('[data-demo="memory"]').forEach(root => {
    const tiles = [...root.querySelectorAll('[data-tile]')];
    const start = root.querySelector('[data-action="start"]');
    const status = root.querySelector('[data-game-status]');
    let sequence = [], position = 0, best = 0, phase = 'idle', run = 0;
    const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
    function lock(locked) { tiles.forEach(tile => tile.disabled = locked); }
    function clearTiles() { tiles.forEach(tile => {tile.classList.remove('lit');tile.setAttribute('aria-label',`Tile ${Number(tile.dataset.tile)+1}`);}); }
    function stop() {
      if(phase === 'watch' || phase === 'play' || phase === 'between') {
        run++; phase = 'idle'; lock(true); clearTiles(); start.textContent = 'Start again ↗'; status.textContent = 'Game paused. Start again whenever you like.';
      }
    }
    async function nextRound(token) {
      if(token !== run) return;
      sequence.push(Math.floor(Math.random()*4)); position = 0; phase = 'watch';lock(true);
      root.querySelector('[data-round]').textContent = sequence.length;
      status.textContent = `Round ${sequence.length}. Watch the sequence.`;
      await wait(650);
      for(const tileIndex of sequence) {
        if(token !== run) return;
        const tile = tiles[tileIndex];tile.classList.add('lit');tile.setAttribute('aria-label',`Tile ${tileIndex+1}, shown`);
        status.textContent = `Watch: ${tileIndex+1}`;
        await wait(650); if(token !== run) return;
        tile.classList.remove('lit'); tile.setAttribute('aria-label',`Tile ${tileIndex+1}`);
        await wait(300);
      }
      if(token !== run) return;
      phase = 'play';lock(false);status.textContent = `Your turn. Repeat ${sequence.length} ${sequence.length === 1 ? 'tile' : 'tiles'}.`;
    }
    start.addEventListener('click', () => {
      run++;sequence=[];position=0;clearTiles();start.textContent='Restart game';nextRound(run);
    });
    tiles.forEach((tile,index) => tile.addEventListener('click', async () => {
      if(phase !== 'play') return;
      if(index !== sequence[position]) {
        phase='over';lock(true);status.textContent=`Not quite. You completed ${sequence.length-1} rounds. Try again?`;start.textContent='Try again ↗';start.focus();return;
      }
      position++;
      if(position === sequence.length) {
        best=Math.max(best,sequence.length);root.querySelector('[data-best]').textContent=best;
        phase='between';lock(true);status.textContent=`Round ${sequence.length} complete. Next sequence coming up.`;
        const token=run;await wait(1000);nextRound(token);
      } else status.textContent=`${position} of ${sequence.length} correct. Keep going.`;
    }));
    games.push({stop});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    window.addEventListener('pagehide',stop);
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){stop();start.focus();}});
  });
})();
