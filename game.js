// Zombies Battle Royale - playable version

// --- Input handling
const keys = {};
let mouse = { x: 0, y: 0, down: false };

window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
window.addEventListener('mousedown', e => { mouse.down = true; });
window.addEventListener('mouseup', e => { mouse.down = false; });

// We'll attach canvas later after DOM load
let canvas, ctx;

class Player {
    constructor(name, x = 400, y = 300) {
        this.name = name;
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.position = { x, y };
        this.alive = true;
        this.radius = 12;
        this.speed = 160; // px/sec
        this.shootCooldown = 0;
    }
    update(dt) {
        if (!this.alive) return;
        let vx = 0, vy = 0;
        if (keys['w'] || keys['arrowup']) vy -= 1;
        if (keys['s'] || keys['arrowdown']) vy += 1;
        if (keys['a'] || keys['arrowleft']) vx -= 1;
        if (keys['d'] || keys['arrowright']) vx += 1;
        const len = Math.hypot(vx, vy);
        if (len > 0) {
            vx /= len; vy /= len;
            this.position.x += vx * this.speed * dt;
            this.position.y += vy * this.speed * dt;
            // clamp inside canvas
            this.position.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.position.x));
            this.position.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.position.y));
        }

        if (this.shootCooldown > 0) this.shootCooldown -= dt;

        // mouse firing
        if (mouse.down) {
            this.tryShootAt(mouse.x, mouse.y);
        }
        if (keys[' ']) {
            // shoot toward center mouse if space pressed
            this.tryShootAt(mouse.x, mouse.y);
        }
    }
    tryShootAt(tx, ty) {
        if (!this.alive) return;
        if (this.shootCooldown > 0) return;
        const angle = Math.atan2(ty - this.position.y, tx - this.position.x);
        game.spawnBullet(this.position.x, this.position.y, angle, this);
        this.shootCooldown = 0.25; // 4 shots per second
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && this.alive) {
            this.die();
        }
    }
    die() {
        this.alive = false;
        console.log(this.name + " has died.");
    }
    draw(ctx) {
        // player body
        ctx.fillStyle = this.alive ? "#66ccff" : "#444";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2);
        ctx.fill();
        // health bar
        const w = 36;
        const h = 5;
        const hx = this.position.x - w/2;
        const hy = this.position.y - this.radius - 10;
        ctx.fillStyle = "#000";
        ctx.fillRect(hx, hy, w, h);
        ctx.fillStyle = "#0f0";
        ctx.fillRect(hx, hy, w * Math.max(0, this.health / this.maxHealth), h);
    }
}

class Bullet {
    constructor(x, y, angle, owner) {
        this.position = { x, y };
        this.velocity = { x: Math.cos(angle) * 500, y: Math.sin(angle) * 500 };
        this.radius = 4;
        this.damage = 25;
        this.owner = owner;
        this.alive = true;
    }
    update(dt) {
        if (!this.alive) return;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        // out of bounds
        if (this.position.x < -20 || this.position.x > canvas.width + 20 || this.position.y < -20 || this.position.y > canvas.height + 20) {
            this.alive = false;
        }
    }
    draw(ctx) {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }
}

class Zombie {
    constructor(x = Math.random() * 800, y = Math.random() * 600) {
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 40 + Math.random() * 40; // px/sec
        this.damage = 12;
        this.radius = 14;
        this.position = { x, y };
        this.alive = true;
    }
    moveTowards(player, dt) {
        if (!this.alive || !player.alive) return;
        const dx = player.position.x - this.position.x;
        const dy = player.position.y - this.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.1) {
            this.position.x += (dx / dist) * this.speed * dt;
            this.position.y += (dy / dist) * this.speed * dt;
        }
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && this.alive) {
            this.alive = false;
            // small chance to drop score handled in game
        }
    }
    attack(player) {
        if (!this.alive || !player.alive) return;
        player.takeDamage(this.damage);
    }
    draw(ctx) {
        if (!this.alive) return;
        ctx.fillStyle = "#7cff7c";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2);
        ctx.fill();
        // health bar
        const w = 30;
        const h = 4;
        const hx = this.position.x - w/2;
        const hy = this.position.y - this.radius - 8;
        ctx.fillStyle = "#000";
        ctx.fillRect(hx, hy, w, h);
        ctx.fillStyle = "#f55";
        ctx.fillRect(hx, hy, w * Math.max(0, this.health / this.maxHealth), h);
    }
}

class Game {
    constructor(canvasEl) {
        this.canvas = canvasEl;
        ctx = this.canvas.getContext('2d');
        canvas = this.canvas;
        this.players = [];
        this.zombies = [];
        this.bullets = [];
        this.wave = 1;
        this.gameRunning = true;
        this.lastTime = performance.now();

        // add single player
        const p = new Player("Player1", canvas.width/2, canvas.height/2);
        this.players.push(p);

        this.spawnZombies();
        requestAnimationFrame(this.loop.bind(this));
        this.setupUI();
    }

    setupUI() {
        this.infoEl = document.getElementById('info');
        this.waveEl = document.getElementById('wave');
        this.playersAliveEl = document.getElementById('playersAlive');
        this.updateHUD();
    }

    updateHUD() {
        const p = this.players[0];
        this.infoEl.innerHTML = `${p.name} — Salud: ${Math.max(0, Math.round(p.health))} — Puntaje: ${p.score}`;
        this.waveEl.innerText = `Wave: ${this.wave}`;
        this.playersAliveEl.innerText = `Jugadores vivos: ${this.players.filter(x => x.alive).length}`;
    }

    spawnZombies() {
        const count = this.wave * 5;
        for (let i = 0; i < count; i++) {
            // spawn at random edges
            let x, y;
            const side = Math.floor(Math.random()*4);
            if (side === 0) { x = Math.random()*canvas.width; y = -30; }
            else if (side === 1) { x = Math.random()*canvas.width; y = canvas.height + 30; }
            else if (side === 2) { x = -30; y = Math.random()*canvas.height; }
            else { x = canvas.width + 30; y = Math.random()*canvas.height; }
            this.zombies.push(new Zombie(x, y));
        }
        console.log("Wave " + this.wave + " started with " + this.zombies.length + " zombies!");
    }

    spawnBullet(x, y, angle, owner) {
        this.bullets.push(new Bullet(x, y, angle, owner));
    }

    handleCollisions() {
        // bullets vs zombies
        this.bullets.forEach(b => {
            if (!b.alive) return;
            this.zombies.forEach(z => {
                if (!z.alive) return;
                const d = Math.hypot(b.position.x - z.position.x, b.position.y - z.position.y);
                if (d < b.radius + z.radius) {
                    z.takeDamage(b.damage);
                    b.alive = false;
                    if (!z.alive) {
                        b.owner.score += 60; // kill bonus
                    } else {
                        b.owner.score += 10;
                    }
                }
            });
        });

        // zombies vs players
        this.zombies.forEach(z => {
            if (!z.alive) return;
            this.players.forEach(p => {
                if (!p.alive) return;
                const d = Math.hypot(p.position.x - z.position.x, p.position.y - z.position.y);
                if (d < p.radius + z.radius - 2) { // contact
                    // simple attack cooldown by proximity — deal once per frame contact
                    z.attack(p);
                }
            });
        });
    }

    update(dt) {
        if (!this.gameRunning) return;

        this.players.forEach(p => p.update(dt));
        this.zombies.forEach(z => {
            // move towards closest alive player
            const alivePlayers = this.players.filter(pl => pl.alive);
            if (alivePlayers.length === 0) return;
            // choose nearest player
            let target = alivePlayers[0];
            let minD = Math.hypot(z.position.x - target.position.x, z.position.y - target.position.y);
            for (let i = 1; i < alivePlayers.length; i++) {
                const d = Math.hypot(z.position.x - alivePlayers[i].position.x, z.position.y - alivePlayers[i].position.y);
                if (d < minD) { minD = d; target = alivePlayers[i]; }
            }
            z.moveTowards(target, dt);
        });

        this.bullets.forEach(b => b.update(dt));

        this.handleCollisions();

        // cleanup dead bullets
        this.bullets = this.bullets.filter(b => b.alive);
        // keep zombies array but allow dead ones to remain (draw skips dead)
        const playersAlive = this.players.some(p => p.alive);
        if (!playersAlive) {
            this.endGame();
        }

        const zombiesAlive = this.zombies.some(z => z.alive);
        if (!zombiesAlive && this.players.some(p => p.alive)) {
            this.nextWave();
        }

        this.updateHUD();
    }

    render() {
        // clear
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // draw bullets behind
        this.bullets.forEach(b => b.draw(ctx));
        // draw zombies
        this.zombies.forEach(z => z.draw(ctx));
        // draw players
        this.players.forEach(p => p.draw(ctx));

        // crosshair
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(mouse.x - 8, mouse.y);
        ctx.lineTo(mouse.x + 8, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - 8);
        ctx.lineTo(mouse.x, mouse.y + 8);
        ctx.stroke();
    }

    nextWave() {
        this.wave++;
        this.zombies = [];
        this.spawnZombies();
    }

    endGame() {
        this.gameRunning = false;
        console.log("Game Over! Final Scores:");
        this.players.forEach(player => console.log(player.name + ": " + player.score));
        this.infoEl.innerHTML = `Game Over — Puntaje final: ${this.players[0].score}`;
    }

    loop(ts) {
        const dt = Math.min(0.06, (ts - this.lastTime) / 1000); // cap dt
        this.lastTime = ts;
        this.update(dt);
        this.render();
        if (this.gameRunning) requestAnimationFrame(this.loop.bind(this));
    }
}

// Initialize after DOM ready
window.addEventListener('load', () => {
    const c = document.getElementById('gameCanvas');
    // setup mouse rect correct reference
    canvas = c;
    ctx = canvas.getContext('2d');

    // rebind mousemove to capture canvas rect
    window.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    const gameInstance = new Game(c);
    window.game = gameInstance;
});
