// Получение элементов
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const scoreDisplay = document.getElementById("scoreDisplay");

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
let speedMultiplier = 1; // Начальная скорость

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
  const speed = 1; // Учитываем ускорение
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

    if (distanceEarth < planet.radius + asteroid.size / 2) {
      planet.lives--;
      asteroids.splice(index, 1);
      if (planet.lives <= 0) {
        planet.lives = 0;
        endGame();
      }
    } else if (
      moon.isVisible &&
      distanceMoon < moon.radius + asteroid.size / 2
    ) {
      moon.lives--;
      asteroids.splice(index, 1);
    }
    if (moon.lives <= 0) {
      moon.isVisible = false;
      ctx.fillStyle = "red";
      ctx.font = "36px Pixel";
      ctx.fillText(`Луна потеряна!`, 20, 190);
    }
  });
  // asteroids.forEach((asteroid, index) => {
  //   asteroid.x += asteroid.velocity.x;
  //   asteroid.y += asteroid.velocity.y;

  //   const dx = asteroid.x - moon.x;
  //   const dy = asteroid.y - moon.y;
  //   const distance = Math.sqrt(dx * dx + dy * dy);

  //   if (distance < moon.radius + asteroid.size / 2) {
  //     moon.lives--;
  //     asteroids.splice(index, 1);
  //   }
  // });
}

// Клик для уничтожения астероидов
canvas.addEventListener("click", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  asteroids.forEach((asteroid, index) => {
    const dx = x - asteroid.x;
    const dy = y - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < asteroid.size / 2) {
      // Добавляем взрыв в массив
      explosions.push({
        x: asteroid.x,
        y: asteroid.y,
        size: asteroid.size / 3,
        frames: 0,
      });
      asteroids.splice(index, 1);
      score++;
    }
  });
});
// Клик для уничтожения астероидов
canvas.addEventListener("touch", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  asteroids.forEach((asteroid, index) => {
    const dx = x - asteroid.x;
    const dy = y - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < asteroid.size / 2) {
      // Добавляем взрыв в массив
      explosions.push({
        x: asteroid.x,
        y: asteroid.y,
        size: asteroid.size / 3,
        frames: 0,
      });
      asteroids.splice(index, 1);
      score++;
    }
  });
});
// Ускорение игры
function increaseSpeed() {
  if (speedMultiplier < 15) {
    // Максимальная скорость
    speedMultiplier += 0.2; // Увеличиваем скорость каждые 5 секунд
  }
}

// Игровой цикл
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawPlanet();
  drawMoon();

  drawAsteroids();
  drawExplosions();
  drawScore(); // Рисуем текущий счет
  drawLives(moon.lives, planet.lives);
  updateAsteroids();
  // checkCollisionsWithMoon();
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
  speedMultiplier = 1; // Сбрасываем скорость
  createStars();
  asteroidInterval = setInterval(createAsteroid, 1000);
  setInterval(increaseSpeed, 5000); // Ускоряем каждые 5 секунд
  gameLoop();
}

function endGame() {
  gameRunning = false;
  clearInterval(asteroidInterval);
  gameOverScreen.style.display = "flex";
  scoreDisplay.textContent = `Ваш счет: ${score}`;
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
