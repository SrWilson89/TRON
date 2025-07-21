// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error('Canvas element not found!');
} else {
    console.log('Canvas found:', canvas);
}
const ctx = canvas ? canvas.getContext('2d') : null;
if (!ctx) {
    console.error('Canvas context is not available!');
} else {
    console.log('Canvas context initialized:', ctx);
}

// Set canvas size
if (canvas) {
    canvas.width = 800;
    canvas.height = 600;
    console.log('Canvas size set to 800x600');
}

// Game state variables
let score = 0;
let gameOver = false;

// Player object (Light Jet styled as F-18)
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 20,
    speed: 5,
    health: 100,
    maxHealth: 150,
    type: 'LightJet',
    fireRate: 10,
    fireCooldown: 0,
    missileCount: 6,
    maxMissiles: 50,
    missileRechargeTime: 0,
    powerUps: { speedBoost: 0, fastFire: 0, multiShot: 0 },
    powerUpDurationBase: 5,
    draw: function() { // Added draw method to player object
        ctx.save();
        ctx.fillStyle = '#00ccff'; // Explicitly blue for player
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 4, this.y - this.height / 2);
        ctx.lineTo(this.x, this.y - this.height / 4);
        ctx.lineTo(this.x + this.width / 4, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 4, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height * 2);
        ctx.stroke();
        ctx.restore();
        console.log('Player drawn at:', this.x, this.y);
    }
};

// Arrays to store game entities
let enemies = [];
let projectiles = [];
let missiles = [];
let powerUps = [];
let enemyProjectiles = [];

// Keyboard and mouse input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};
if (canvas) {
    canvas.addEventListener('click', handleMouseClick);
    console.log('Click event listener added to canvas');
}

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
    if (e.code in keys) keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    if (e.code in keys) keys[e.code] = false;
});

// --- Entity Classes ---

// Ship class for enemies
class Ship {
    constructor(x, y, width, height, speed, health, type, damage) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.health = health;
        this.type = type;
        this.damage = damage;
        this.fireRate = 60;
        this.fireCooldown = 0;
    }

    // Draw the ship with F-18 style for LightJet and TRON Recognizer
    draw() {
        ctx.save();
        if (this.type === 'LightJet') {
            ctx.fillStyle = '#ff0000'; // Red for enemy LightJet
            ctx.strokeStyle = '#ff0000';
        } else if (this.type === 'Recognizer') {
            ctx.fillStyle = '#ff4500'; // Orange for Recognizers
            ctx.strokeStyle = '#ff4500';
        }
        ctx.lineWidth = 2;
        if (this.type === 'LightJet') {
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
            ctx.lineTo(this.x - this.width / 4, this.y - this.height / 2);
            ctx.lineTo(this.x, this.y - this.height / 4);
            ctx.lineTo(this.x + this.width / 4, this.y - this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
            ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
            ctx.lineTo(this.x - this.width / 4, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height / 2);
            ctx.lineTo(this.x, this.y + this.height * 2);
            ctx.stroke();
        } else if (this.type === 'Recognizer') {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
            ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x - this.width / 4, this.y + this.height / 2);
            ctx.lineTo(this.x - this.width / 4, this.y);
            ctx.lineTo(this.x + this.width / 4, this.y);
            ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height / 2);
            ctx.lineTo(this.x, this.y + this.height * 1.5);
            ctx.stroke();
        }
        ctx.restore();
        console.log('Enemy drawn at:', this.x, this.y, 'type:', this.type);
    }

    // Update ship position and behavior
    update() {
        if (this.type === 'Recognizer') {
            this.y += this.speed;
            if (this.y > canvas.height + this.height) this.y = -this.height;
        } else if (this.type === 'LightJet' && this.health > 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 50) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
            if (this.fireCooldown <= 0) {
                const projectile = new Projectile(this.x, this.y + this.height / 2, 5, 15, 'Recognizer');
                enemyProjectiles.push(projectile);
                this.fireCooldown = this.fireRate;
            } else {
                this.fireCooldown--;
            }
        }
    }
}

// Projectile class for shots fired by ships
class Projectile {
    constructor(x, y, speed, damage, type, angle = 0) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.width = type === 'LightJet' ? 5 : 10;
        this.height = type === 'LightJet' ? 10 : 15;
        this.type = type;
        this.angle = angle;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.type === 'LightJet' ? '#00ccff' : this.type === 'Recognizer' ? '#ff4500' : '#ff0000';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.restore();
    }

    update() {
        this.y += this.speed * Math.cos(this.angle);
        this.x += this.speed * Math.sin(this.angle);
        if (this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            return true;
        }
        return false;
    }
}

// Missile class for guided missiles
class Missile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 12;
        this.speed = 10;
        this.target = target;
        this.damage = 50;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.restore();
    }

    update() {
        if (this.target && this.target.health > 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else {
            this.y -= this.speed;
        }
        if (this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
            return true;
        }
        return false;
    }
}

// PowerUp class with Font Awesome icons, moving toward player
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.speed = 2;
    }

    draw() {
        ctx.save();
        ctx.font = '16px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon;
        if (this.type === 'speedBoost') icon = '\uf51c'; // fa-gauge-high (speed)
        else if (this.type === 'fastFire') icon = '\uf021'; // fa-bullseye (rapid fire)
        else if (this.type === 'multiShot') icon = '\uf0e2'; // fa-crosshairs (multi-shot)
        ctx.fillStyle = this.type === 'speedBoost' ? '#00ff00' : this.type === 'fastFire' ? '#ff00ff' : '#ffff00';
        ctx.fillText(icon, this.x, this.y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeText(icon, this.x, this.y);
        ctx.restore();
    }

    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        if (distance < this.width / 2) {
            return true;
        }
        return false;
    }
}

// --- Game Functions ---

// Spawn an enemy based on score
function spawnEnemy() {
    let type, health, speed, damage;
    if (score >= 2000) {
        type = Math.random() < 0.5 ? 'LightJet' : 'Recognizer'; // 50/50 chance
        if (type === 'LightJet') {
            health = 30;
            speed = 2;
            damage = 10;
        } else {
            health = 75;
            speed = 1.5;
            damage = 25;
        }
    } else if (score >= 1500) {
        type = 'LightJet';
        health = 30;
        speed = 2;
        damage = 10;
    } else if (score >= 500) {
        type = 'Recognizer';
        health = 75;
        speed = 1.5;
        damage = 25;
    } else {
        type = 'Recognizer';
        health = 50;
        speed = 1;
        damage = 20;
    }
    const enemy = new Ship(
        Math.random() * (canvas.width - 50) + 25,
        -30,
        type === 'Recognizer' ? 50 : 30,
        type === 'Recognizer' ? 40 : 20,
        speed,
        health,
        type,
        damage
    );
    if (type === 'LightJet') enemy.fireRate = 120;
    enemies.push(enemy);
    console.log('Enemy spawned:', type, 'at', enemy.x, enemy.y);
}

// Spawn a power-up at enemy position
function spawnPowerUp(x, y) {
    const types = ['speedBoost', 'fastFire', 'multiShot'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(x, y, type);
    powerUps.push(powerUp);
    if (Math.random() < 0.3) {
        player.missileCount = Math.min(player.missileCount + 1, player.maxMissiles);
        updateUI();
    }
    console.log('Power-up spawned:', type, 'at', x, y);
}

// Handle player movement with power-up effects and health recovery
function movePlayer() {
    let currentSpeed = player.speed;
    if (player.powerUps.speedBoost > 0) {
        currentSpeed *= 1.5;
        player.powerUps.speedBoost--;
    }
    if (keys.ArrowLeft && player.x - player.width / 2 > 0) {
        player.x -= currentSpeed;
    }
    if (keys.ArrowRight && player.x + player.width / 2 < canvas.width) {
        player.x += currentSpeed;
    }
    if (keys.ArrowUp && player.y - player.height / 2 > 0) {
        player.y -= currentSpeed;
    }
    if (keys.ArrowDown && player.y + player.height / 2 < canvas.height) {
        player.y += currentSpeed;
    }
    if (player.health < player.maxHealth) {
        player.health = Math.min(player.health + 0.1, player.maxHealth);
        updateUI();
    }
}

// Handle player shooting with power-up effects
function playerShoot() {
    let currentFireRate = player.fireRate;
    let damage = 10;
    let shotCount = 2;
    let angles = [-0.1, 0.1];

    if (player.powerUps.speedBoost > 0 || player.powerUps.fastFire > 0 || player.powerUps.multiShot > 0) {
        shotCount = 5;
        damage *= 1.5;
        angles = [-0.2, -0.1, 0, 0.1, 0.2];
        if (player.powerUps.speedBoost > 0) player.powerUps.speedBoost--;
        if (player.powerUps.fastFire > 0) player.powerUps.fastFire--;
        if (player.powerUps.multiShot > 0) player.powerUps.multiShot--;
    }

    if (keys.Space && player.fireCooldown <= 0 && !gameOver) {
        angles.forEach((angle, index) => {
            const offsetX = index === 0 ? -10 : index === 1 ? 10 : index === 2 ? 0 : index === 3 ? -5 : 5;
            const projectile = new Projectile(
                player.x + offsetX,
                player.y - player.height / 2,
                -8,
                damage,
                'LightJet',
                angle
            );
            projectiles.push(projectile);
        });
        player.fireCooldown = currentFireRate;
    }
    if (player.fireCooldown > 0) {
        player.fireCooldown--;
    }

    if (player.missileCount < player.maxMissiles && player.missileRechargeTime <= 0) {
        player.missileCount++;
        player.missileRechargeTime = 300;
        updateUI();
    }
    if (player.missileRechargeTime > 0) {
        player.missileRechargeTime--;
    }
}

// Handle mouse click for missile launch
function handleMouseClick(event) {
    if (player.missileCount > 0 && !gameOver) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const target = enemies.find(enemy => enemy.health > 0);
        if (target) {
            const missile = new Missile(player.x, player.y - player.height / 2, target);
            missiles.push(missile);
            player.missileCount--;
            updateUI();
        }
    }
}

// Check for collisions between entities
function checkCollisions() {
    // Projectiles vs Enemies
    projectiles.forEach((proj, projIndex) => {
        if (proj.type === 'LightJet') {
            enemies.forEach((enemy, enemyIndex) => {
                if (
                    proj.x + proj.width / 2 > enemy.x - enemy.width / 2 &&
                    proj.x - proj.width / 2 < enemy.x + enemy.width / 2 &&
                    proj.y + proj.height / 2 > enemy.y - enemy.height / 2 &&
                    proj.y - proj.height / 2 < enemy.y + enemy.height / 2
                ) {
                    enemy.health -= proj.damage;
                    projectiles.splice(projIndex, 1);
                    if (enemy.health <= 0) {
                        enemies.splice(enemyIndex, 1);
                        score += 10;
                        if (Math.random() < 0.5) {
                            spawnPowerUp(enemy.x, enemy.y);
                        }
                        updateUI();
                    }
                }
            });
        }
    });

    // Missiles vs Enemies
    missiles.forEach((missile, missileIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                missile.x + missile.width / 2 > enemy.x - enemy.width / 2 &&
                missile.x - missile.width / 2 < enemy.x + enemy.width / 2 &&
                missile.y + missile.height / 2 > enemy.y - enemy.height / 2 &&
                missile.y - missile.height / 2 < enemy.y + enemy.height / 2
            ) {
                enemy.health -= missile.damage;
                missiles.splice(missileIndex, 1);
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += 20;
                    if (Math.random() < 0.5) {
                        spawnPowerUp(enemy.x, enemy.y);
                    }
                    updateUI();
                }
            }
        });
    });

    // Enemy Projectiles vs Player
    enemyProjectiles.forEach((proj, projIndex) => {
        if (
            player.x + player.width / 2 > proj.x - proj.width / 2 &&
            player.x - player.width / 2 < proj.x + proj.width / 2 &&
            player.y + player.height / 2 > proj.y - proj.height / 2 &&
            player.y - player.height / 2 < proj.y + proj.height / 2
        ) {
            player.health -= proj.damage;
            enemyProjectiles.splice(projIndex, 1);
            updateUI();
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    });

    // Enemies vs Player
    enemies.forEach((enemy, enemyIndex) => {
        if (
            player.x + player.width / 2 > enemy.x - enemy.width / 2 &&
            player.x - player.width / 2 < enemy.x + enemy.width / 2 &&
            player.y + player.height / 2 > enemy.y - enemy.height / 2 &&
            player.y - player.height / 2 < enemy.y + enemy.height / 2
        ) {
            player.health -= enemy.damage;
            enemies.splice(enemyIndex, 1);
            updateUI();
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    });

    // Player vs PowerUps
    powerUps.forEach((powerUp, powerUpIndex) => {
        if (
            player.x + player.width / 2 > powerUp.x - powerUp.width / 2 &&
            player.x - player.width / 2 < powerUp.x + powerUp.width / 2 &&
            player.y + player.height / 2 > powerUp.y - powerUp.height / 2 &&
            player.y - powerUp.height / 2 < powerUp.y + powerUp.height / 2
        ) {
            const duration = player.powerUpDurationBase + Math.floor((score / 100) / 3);
            if (powerUp.type === 'speedBoost') {
                player.powerUps.speedBoost += duration * 60;
            } else if (powerUp.type === 'fastFire') {
                player.powerUps.fastFire += duration * 60;
            } else if (powerUp.type === 'multiShot') {
                player.powerUps.multiShot += duration * 60;
            }
            powerUps.splice(powerUpIndex, 1);
            updateUI();
        }
    });
}

// Update UI elements including power-up status
function updateUI() {
    document.getElementById('score-value').textContent = score;
    document.getElementById('health-value').textContent = Math.floor(player.health);
    document.getElementById('missile-value').textContent = player.missileCount;
    const powerUpStatus = document.getElementById('power-up-status');
    powerUpStatus.innerHTML = '';
    if (player.powerUps.speedBoost > 0) powerUpStatus.innerHTML += 'Speed Boost: ' + Math.ceil(player.powerUps.speedBoost / 60) + 's<br>';
    if (player.powerUps.fastFire > 0) powerUpStatus.innerHTML += 'Fast Fire: ' + Math.ceil(player.powerUps.fastFire / 60) + 's<br>';
    if (player.powerUps.multiShot > 0) powerUpStatus.innerHTML += 'MultiShot: ' + Math.ceil(player.powerUps.multiShot / 60) + 's<br>';
}

// Main game loop
function gameLoop() {
    if (!ctx) {
        console.error('Canvas context is not available!');
        return;
    }

    if (gameOver) {
        ctx.fillStyle = '#00ccff';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player
    movePlayer();
    playerShoot();
    player.draw(); // Draw player using its own draw method

    // Spawn enemies periodically
    if (Math.random() < 0.02) {
        spawnEnemy();
    }

    // Update and draw enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });

    // Update and draw projectiles
    projectiles = projectiles.filter(proj => !proj.update());
    projectiles.forEach(proj => proj.draw());

    // Update and draw enemy projectiles
    enemyProjectiles = enemyProjectiles.filter(proj => !proj.update());
    enemyProjectiles.forEach(proj => proj.draw());

    // Update and draw missiles
    missiles = missiles.filter(missile => !missile.update());
    missiles.forEach(missile => missile.draw());

    // Update and draw power-ups
    powerUps = powerUps.filter(powerUp => !powerUp.update());
    powerUps.forEach(powerUp => powerUp.draw());

    // Check collisions
    checkCollisions();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();