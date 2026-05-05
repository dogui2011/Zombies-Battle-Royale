// Zombies Battle Royale Game Logic

class Player {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.score = 0;
        this.position = { x: 0, y: 0 };
    }
    move(x, y) {
        this.position.x += x;
        this.position.y += y;
    }
    shoot() {
        // Logic for shooting
        console.log(this.name + " shoots!");
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    die() {
        console.log(this.name + " has died.");
    }
}

class Zombie {
    constructor() {
        this.health = 50;
        this.position = { x: Math.random() * 100, y: Math.random() * 100 };
    }
    moveTowards(player) {
        // Basic AI to move towards player
        if (this.position.x < player.position.x) this.position.x++;
        else if (this.position.x > player.position.x) this.position.x--;
        if (this.position.y < player.position.y) this.position.y++;
        else if (this.position.y > player.position.y) this.position.y--;
    }
    takeDamage(amount) {
        this.health -= amount;
    }
}

class Game {
    constructor() {
        this.players = [];
        this.zombies = [];
        this.wave = 1;
        this.spawnZombies();
    }
    spawnZombies() {
        for (let i = 0; i < this.wave * 5; i++) {
            this.zombies.push(new Zombie());
        }
    }
    update() {
        // Game logic for each update
        this.zombies.forEach(zombie => {
            this.players.forEach(player => {
                zombie.moveTowards(player);
                // Check for collision and apply damage
                // Apply player's shooting logic
            });
        });
    }
}

const game = new Game();
const player1 = new Player("Player1");
game.players.push(player1);
