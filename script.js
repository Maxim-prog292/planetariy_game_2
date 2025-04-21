// Получение элементов
const returnButton = document.querySelectorAll(".returnButton");
console.log(returnButton);
returnButton.forEach((element) =>
  element.addEventListener("click", () => {
    window.location.href = "https://maxim-prog292.github.io/Game-selection/";
  })
);
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const scoreDisplay = document.getElementById("scoreDisplay");
document.addEventListener("keydown", (e) => {
  if (e.key === "s") activateShield(); // Щит
  if (e.key === "l") activateLaser(); // Лазер
});
const shieldImg = new Image();
shieldImg.src = "shield.png";

const laserImg = new Image();
laserImg.src = "laser.png";

document.addEventListener(
  "touchstart",
  (e) => {
    // Если используется более одного пальца
    if (e.touches.length > 1) {
      e.preventDefault(); // Отключаем действие по умолчанию
    }
  },
  { passive: false }
); // { passive: false } важно для предотвращения поведения по умолчанию
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault(); // Отключаем зумирование двумя пальцами
    }
  },
  { passive: false }
); // { passive: false } важно для отмены действия по умолчанию

// Настройка холста
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Основные переменные
let planet = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 120,
  lives: 15,
}; // Увеличен радиус на 50%
let moon = {
  x: 0,
  y: 0,
  radius: 40,
  lives: 10,
  orbitRadius: Math.min(canvas.width, canvas.height) / 2.2,
  rotationSpeed: 0.006, //0.006
  angle: 0,
  image: new Image(),
  isVisible: true,
};
moon.image.src = "image/planet/moon.png";

let asteroids = [];
let explosions = [];
let stars = [];
let score = 0;
let gameRunning = false;
let asteroidInterval;
let speedMultiplier = 5; // Начальная скорость

// Переменные бонусов
let bonuses = [];
let shieldActive = false;
let laserActive = false;
let laserTimer = 0;
const laserDuration = 600; // 30 секунд * 60 FPS
const laserRadius = 200;

function activateShield() {
  shieldActive = true;
}

function activateLaser() {
  laserActive = true;
  laserTimer = laserDuration;
}

// Создание звёзд
function createStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
    });
  }
}

// Создание астероидов
function createAsteroid() {
  const sizeOptions = [120, 152]; // Увеличены размеры на 30% дважды
  const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
  const speed = 4; // Учитываем ускорение
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = -size;
  } else if (edge === 1) {
    x = canvas.width + size;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + size;
  } else {
    x = -size;
    y = Math.random() * canvas.height;
  }

  const angle = Math.atan2(planet.y - y, planet.x - x);
  asteroids.push({
    x,
    y,
    size,
    speed,
    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
  });
}
const planetImage = new Image();
planetImage.src = "image/planet/earth.png";
// Рисование элементов
function drawPlanet() {
  // Убедимся, что изображение загружено перед отрисовкой
  if (planetImage.complete) {
    ctx.drawImage(
      planetImage,
      planet.x - planet.radius, // Центрируем изображение по X
      planet.y - planet.radius, // Центрируем изображение по Y
      planet.radius * 2, // Ширина изображения равна диаметру планеты
      planet.radius * 2 // Высота изображения равна диаметру планеты
    );
  } else {
    // Если изображение еще не загрузилось, используем стандартную отрисовку круга
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}
function drawMoon() {
  if (!moon.isVisible) return;
  // Вычисляем положение луны на орбите вокруг Земли
  moon.x = planet.x + Math.cos(moon.angle) * moon.orbitRadius;
  moon.y = planet.y + Math.sin(moon.angle) * moon.orbitRadius;

  // Увеличиваем угол для следующего кадра (вращение луны)
  // moon.angle += moon.rotationSpeed;

  // Рисуем луну
  if (moon.image.complete) {
    ctx.drawImage(
      moon.image,
      moon.x - moon.radius, // Центрируем изображение по X
      moon.y - moon.radius, // Центрируем изображение по Y
      moon.radius * 2,
      moon.radius * 2
    );
  } else {
    // Если изображение не загружено, рисуем круг вместо луны
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, 100, 0, Math.PI * 2);
    ctx.fillStyle = "gray"; // Цвет луны (серый)
    ctx.fill();
  }
  moon.angle += moon.rotationSpeed;
}

// function checkCollisionsWithMoon() {
//   asteroids.forEach((asteroid, index) => {
//     const dx = asteroid.x - moon.x;
//     const dy = asteroid.y - moon.y;
//     const distance = Math.sqrt(dx * dx + dy * dy);

//     if (distance < asteroid.size / 2 + moon.size / 2) {
//       // Столкновение произошло
//       explosions.push({
//         x: asteroid.x,
//         y: asteroid.y,
//         size: asteroid.size,
//         frames: 0,
//       });

//       asteroids.splice(index, 1); // Удаляем метеорит
//       moon.lives--; // Уменьшаем жизни Луны

//       if (moon.lives <= 0) {
//         console.log("The Moon has been destroyed!");
//         // Здесь можно добавить логику завершения игры или уничтожения Луны
//       }
//     }
//   });
// }

function drawStars() {
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  });
}
const asteroidImage = new Image();
asteroidImage.src = "meteorit.png";
function drawAsteroids() {
  asteroids.forEach((asteroid) => {
    if (asteroidImage.complete) {
      ctx.drawImage(
        asteroidImage,
        asteroid.x - asteroid.size / 2, // Центрируем изображение по X
        asteroid.y - asteroid.size / 2, // Центрируем изображение по Y
        asteroid.size,
        asteroid.size
      );
    } else {
      // Если изображение еще не загрузилось, используем стандартную отрисовку круга
      ctx.beginPath();
      ctx.arc(asteroid.x, asteroid.y, asteroid.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = "gray";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}
const explosionsImage = new Image();
explosionsImage.src = "bum.png";
function drawExplosions() {
  // Перебираем взрывы
  explosions.forEach((explosion) => {
    // Увеличиваем количество кадров анимации
    explosion.frames++;

    // Если изображение загружено, рисуем его
    if (explosionsImage.complete) {
      ctx.drawImage(
        explosionsImage,
        explosion.x - explosion.size, // Центрируем изображение по X
        explosion.y - explosion.size, // Центрируем изображение по Y
        explosion.size * 3,
        explosion.size * 2.5
      );
    } else {
      // Если изображение еще не загрузилось, рисуем круг с эффектом исчезновения
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 69, 0, ${1 - explosion.frames / 30})`; // Постепенное исчезновение
      ctx.fill();
    }
  });

  // Удаляем взрывы, у которых анимация завершилась
  explosions = explosions.filter((explosion) => explosion.frames <= 30);
}

// Рисование счета
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "36px Pixel";
  ctx.fillText(`Счет: ${score}`, 20, 40);
}
function drawLives(moon, planet) {
  ctx.fillStyle = "white";
  ctx.font = "36px Pixel";
  ctx.fillText(`Жизни Земли: ${planet}`, 20, 90);
  ctx.fillText(`Жизни Луны: ${moon}`, 20, 140);
}

// Обновление игры
// Обновление астероидов (замени свою функцию)
function updateAsteroids() {
  asteroids.forEach((asteroid, index) => {
    asteroid.x += asteroid.velocity.x;
    asteroid.y += asteroid.velocity.y;

    const dx = asteroid.x - planet.x;
    const dy = asteroid.y - planet.y;
    const distanceEarth = Math.sqrt(dx * dx + dy * dy);

    const dmx = asteroid.x - moon.x;
    const dmy = asteroid.y - moon.y;
    const distanceMoon = Math.sqrt(dmx * dmx + dmy * dmy);

    let destroyed = false;

    if (shieldActive && distanceEarth < planet.radius + asteroid.size / 2) {
      // Щит ломается
      shieldActive = false;
      destroyed = true;
    } else if (distanceEarth < planet.radius + asteroid.size / 2) {
      planet.lives--;
      destroyed = true;
      if (planet.lives <= 0) {
        planet.lives = 0;
        endGame();
      }
    } else if (
      moon.isVisible &&
      distanceMoon < moon.radius + asteroid.size / 2
    ) {
      moon.lives--;
      destroyed = true;
    }

    // Уничтожение лазером
    if (laserActive) {
      const lx = asteroid.x - planet.x;
      const ly = asteroid.y - planet.y;
      const distLaser = Math.sqrt(lx * lx + ly * ly);
      if (distLaser < laserRadius) {
        destroyed = true;
      }
    }

    if (destroyed) {
      explosions.push({
        x: asteroid.x,
        y: asteroid.y,
        size: asteroid.size / 2,
        frames: 0,
      });

      // 40% шанс дропа бонуса
      if (Math.random() < 0.4) {
        bonuses.push({
          x: asteroid.x,
          y: asteroid.y,
          type: Math.random() < 0.5 ? "shield" : "laser",
          size: 50,
        });
      }

      asteroids.splice(index, 1);
    }
  });

  if (moon.lives <= 0) {
    moon.isVisible = false;
    ctx.fillStyle = "red";
    ctx.font = "36px Pixel";
    ctx.fillText(`Луна потеряна!`, 20, 220);
  }
}

// Обработка кликов по бонусам
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (let i = 0; i < bonuses.length; i++) {
    const b = bonuses[i];
    const dx = mx - b.x;
    const dy = my - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < b.size / 2) {
      if (b.type === "shield") activateShield();
      if (b.type === "laser") activateLaser();
      bonuses.splice(i, 1);
      return;
    }
  }

  // обычное уничтожение астероида по клику
  asteroids.forEach((asteroid, index) => {
    const dx = mx - asteroid.x;
    const dy = my - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < asteroid.size / 2) {
      explosions.push({
        x: asteroid.x,
        y: asteroid.y,
        size: asteroid.size / 3,
        frames: 0,
      });
      asteroids.splice(index, 1);
      score++;

      // шанс выпадения бонуса
      if (Math.random() < 0.2) {
        bonuses.push({
          x: asteroid.x,
          y: asteroid.y,
          type: Math.random() < 0.5 ? "shield" : "laser",
          size: 50,
          spawnTime: Date.now(),
        });
      }
    }
  });
});
// Рисование бонусов
function drawBonuses() {
  const now = Date.now();
  bonuses.forEach((bonus) => {
    const img = bonus.type === "shield" ? shieldImg : laserImg;
    ctx.drawImage(
      img,
      bonus.x - bonus.size / 2,
      bonus.y - bonus.size / 2,
      bonus.size,
      bonus.size
    );
  });
  bonuses = bonuses.filter((bonus) => now - bonus.spawnTime < 5000);
}

// Рисование щита
function drawShield() {
  if (shieldActive) {
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius + 15, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,150,255,0.4)";
    ctx.lineWidth = 12;
    ctx.stroke();
  }
}

// Рисование лазера
function drawLaser() {
  if (laserActive) {
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, laserRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,0,0,0.2)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}
// // Ускорение игры
// function increaseSpeed() {
//   if (speedMultiplier < 300) {
//     // Максимальная скорость
//     speedMultiplier += 0.2; // Увеличиваем скорость каждые 5 секунд
//   }
// }

// Игровой цикл
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawPlanet();
  drawMoon();
  drawShield();
  drawLaser();
  drawBonuses();
  drawAsteroids();
  drawExplosions();
  drawScore();
  drawLives(moon.lives, planet.lives);
  updateAsteroids();

  if (laserActive) {
    laserTimer--;
    ctx.fillStyle = "white";
    ctx.font = "20px Pixel";
    ctx.fillText(`ЛАЗЕР: ${Math.ceil(laserTimer / 60)}с`, 20, 170);
    if (laserTimer <= 0) {
      laserActive = false;
    }
  }

  requestAnimationFrame(gameLoop);
}

// Управление игрой
function startGame() {
  startScreen.style.display = "none";
  gameRunning = true;
  planet.lives = 15;
  moon.lives = 10;
  moon.isVisible = true;
  score = 0;
  asteroids = [];
  explosions = [];
  speedMultiplier = 5; // Сбрасываем скорость
  createStars();
  asteroidInterval = setInterval(createAsteroid, 1000);
  // setInterval(increaseSpeed, 1000); // Ускоряем каждые 5 секунд
  gameLoop();
}

// endGame — сбросить бонусы
function endGame() {
  gameRunning = false;
  clearInterval(asteroidInterval);
  gameOverScreen.style.display = "flex";
  scoreDisplay.textContent = `Ваш счет: ${score}`;

  // Сброс всех бонусов
  bonuses = [];
  shieldActive = false;
  laserActive = false;
  laserTimer = 0;
}

function restartGame() {
  gameOverScreen.style.display = "none";
  startGame();
}

// Обработчики кнопок
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

// Создание звёзд при старте
createStars();
