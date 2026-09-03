// Rendering engine for Zombies Battle Royale

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Scale factor for rendering (game units to pixels)
const SCALE = 5;

function drawPlayer(player) {
    ctx.fillStyle = player.alive ? '#00ff00' : '#666666';
    ctx.beginPath();
    ctx.arc(player.position.x * SCALE, player.position.y * SCALE, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw health bar
    const barWidth = 20;
    const barHeight = 3;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
        player.position.x * SCALE - barWidth / 2,
        player.position.y * SCALE - 15,
        barWidth,
        barHeight
    );
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
        player.position.x * SCALE - barWidth / 2,
        player.position.y * SCALE - 15,
        (player.health / player.maxHealth) * barWidth,
        barHeight
    );
    
    // Draw name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.position.x * SCALE, player.position.y * SCALE + 20);
}

function drawZombie(zombie) {
    if (zombie.health <= 0) return;
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(zombie.position.x * SCALE, zombie.position.y * SCALE, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw health bar
    const barWidth = 12;
    const barHeight = 2;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
        zombie.position.x * SCALE - barWidth / 2,
        zombie.position.y * SCALE - 10,
        barWidth,
        barHeight
    );
    
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(
        zombie.position.x * SCALE - barWidth / 2,
        zombie.position.y * SCALE - 10,
        (zombie.health / zombie.maxHealth) * barWidth,
        barHeight
    );
}

function updateStats() {
    if (game.players.length > 0) {
        const player = game.players[0];
        document.getElementById('playerName').textContent = player.name;
        document.getElementById('playerHealth').textContent = `${Math.max(0, player.health)} / ${player.maxHealth}`;
        document.getElementById('playerScore').textContent = player.score;
    }
    
    document.getElementById('wave').textContent = game.wave;
    document.getElementById('zombieCount').textContent = game.zombies.filter(z => z.health > 0).length;
    
    if (!game.gameRunning) {
        const statusDiv = document.getElementById('gameStatus');
        statusDiv.innerHTML = '<div class="game-over">🎮 GAME OVER 🎮</div>';
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += SCALE * 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += SCALE * 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw zombies
    game.zombies.forEach(zombie => drawZombie(zombie));
    
    // Draw players
    game.players.forEach(player => drawPlayer(player));
    
    // Draw wave info
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Wave: ${game.wave}`, 10, 25);
    
    // Update stats panel
    updateStats();
}

// Render loop
setInterval(() => {
    render();
}, 50);