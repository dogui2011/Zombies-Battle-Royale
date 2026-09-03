// Zombies Battle Royale Game Logic

class Player {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.position = { x: 0, y: 0 };
        this.alive = true;
    }
    move(x, y) {
        this.position.x += x;
        this.position.y += y;
    }
    shoot(zombies) {
        if (!this.alive) return 0;
        let killed = 0;
        // Dispara al zombi más cercano
        let closest = null;
        let minDistance = 100;
        
        zombies.forEach(zombie => {
            if (zombie.health > 0) {
                const distance = Math.hypot(
                    this.position.x - zombie.position.x,
                    this.position.y - zombie.position.y
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = zombie;
                }
            }
        });
        
        if (closest) {
            closest.takeDamage(25);
            this.score += 10;
            if (closest.health <= 0) {
                killed = 1;
                this.score += 50;
            }
            console.log(this.name + " shoots! Score: " + this.score);
        }
        return killed;
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    die() {
        this.alive = false;
        console.log(this.name + " has died.");
    }
}

class Zombie {
    constructor(x, y) {
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 1;
        this.damage = 10;
        this.position = { x: x || Math.random() * 100, y: y || Math.random() * 100 };
    }
    moveTowards(player) {
        if (this.health <= 0) return;
        
        const distance = Math.hypot(
            this.position.x - player.position.x,
            this.position.y - player.position.y
        );
        
        if (distance > 0) {
            const dx = (player.position.x - this.position.x) / distance;
            const dy = (player.position.y - this.position.y) / distance;
            
            this.position.x += dx * this.speed;
            this.position.y += dy * this.speed;
        }
    }
    takeDamage(amount) {
        this.health -= amount;
    }
    attack(player) {
        if (this.health > 0) {
            player.takeDamage(this.damage);
        }
    }
}

class Game {
    constructor(canvas = null) {
        this.players = [];
        this.zombies = [];
        this.wave = 1;
        this.gameRunning = true;
        this.canvas = canvas;
        this.spawnZombies();
        this.gameLoop();
    }
    
    spawnZombies() {
        for (let i = 0; i < this.wave * 5; i++) {
            this.zombies.push(new Zombie());
        }
        console.log("Wave " + this.wave + " started with " + this.zombies.length + " zombies!");
    }
    
    checkCollisions() {
        this.zombies.forEach(zombie => {
            if (zombie.health <= 0) return;
            
            this.players.forEach(player => {
                if (!player.alive) return;
                
                const distance = Math.hypot(
                    player.position.x - zombie.position.x,
                    player.position.y - zombie.position.y
                );
                
                // Si el zombi llega al jugador
                if (distance < 5) {
                    zombie.attack(player);
                }
            });
        });
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Actualizar movimiento de zombies
        this.zombies.forEach(zombie => {
            this.players.forEach(player => {
                if (player.alive && zombie.health > 0) {
                    zombie.moveTowards(player);
                }
            });
        });
        
        // Verificar colisiones
        this.checkCollisions();
        
        // Verificar si todos los jugadores murieron
        const playersAlive = this.players.some(p => p.alive);
        if (!playersAlive) {
            this.endGame();
        }
        
        // Verificar si todos los zombies murieron
        const zombiesAlive = this.zombies.some(z => z.health > 0);
        if (!zombiesAlive && this.players.some(p => p.alive)) {
            this.nextWave();
        }
    }
    
    nextWave() {
        this.wave++;
        this.zombies = [];
        this.spawnZombies();
    }
    
    endGame() {
        this.gameRunning = false;
        console.log("Game Over! Final Scores:");
        this.players.forEach(player => {
            console.log(player.name + ": " + player.score);
        });
    }
    
    gameLoop() {
        const interval = setInterval(() => {
            if (!this.gameRunning) {
                clearInterval(interval);
                return;
            }
            this.update();
        }, 100);
    }
}

// Inicialización
const game = new Game();
const player1 = new Player("Player1");
game.players.push(player1);

// Ejemplo: Simular disparo cada segundo
setInterval(() => {
    if (player1.alive) {
        player1.shoot(game.zombies);
    }
}, 1000);
