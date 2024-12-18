const TILE_SIZE = 32;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = TILE_SIZE * MAP_NUM_COLS;
const WINDOW_HEIGHT = TILE_SIZE * MAP_NUM_ROWS;

const FOV_ANGLE = 60 * (Math.PI / 180); //fov angle in radians

const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.2;

class Map {
  constructor() {
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  }
  hasWallAt(x, y) {
    var x_check = Math.floor(x / TILE_SIZE);
    var y_check = Math.floor(y / TILE_SIZE);
    if (this.grid[y_check][x_check] == 1) {
      return true;
    }
    return false;
  }
  render() {
    for (var i = 0; i < MAP_NUM_ROWS; i++) {
      for (var j = 0; j < MAP_NUM_COLS; j++) {
        var tileX = j * TILE_SIZE;
        var tileY = i * TILE_SIZE;
        var tileColor = this.grid[i][j] == 1 ? "#222" : "#fff";
        stroke("#ZZZ");
        fill(tileColor);
        rect(
          MINIMAP_SCALE_FACTOR * tileX,
          MINIMAP_SCALE_FACTOR * tileY,
          MINIMAP_SCALE_FACTOR * TILE_SIZE,
          MINIMAP_SCALE_FACTOR * TILE_SIZE
        );
      }
    }
  }
}

class Player {
  constructor() {
    this.x = WINDOW_WIDTH / 2;
    this.y = WINDOW_HEIGHT / 2;
    this.radius = 3;
    this.turnDirection = 0; // -1 if left, 1 if right
    this.walkDirection = 0; // -1 if back, 1 if front
    this.rotationAngle = Math.PI / 2; // 90 decgrees
    this.moveSpeed = 2.0;
    this.rotationSpeed = 2 * (Math.PI / 180); // convert to radians
  }
  update() {
    // update player position based on turnDirection and walkDirection
    this.rotationAngle += this.turnDirection * this.rotationSpeed;
    var moveStep = this.walkDirection * this.moveSpeed;

    // My implementation of collision detection. Partially correct.
    // var x_check = Math.floor(this.x / TILE_SIZE);
    // var y_check = Math.floor(this.y / TILE_SIZE);
    // if (grid.grid[x_check][y_check] == 1) {
    //   this.moveSpeed = 0;
    // }

    var newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep;
    var newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep;

    // only set new player position if it is not colliding with map walls
    if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
      this.x = newPlayerX;
      this.y = newPlayerY;
    }
  }
  render() {
    noStroke();
    fill("red");
    circle(
      MINIMAP_SCALE_FACTOR * this.x,
      MINIMAP_SCALE_FACTOR * this.y,
      MINIMAP_SCALE_FACTOR * this.radius
    );
    stroke("red");
    line(
      MINIMAP_SCALE_FACTOR * this.x,
      MINIMAP_SCALE_FACTOR * this.y,
      MINIMAP_SCALE_FACTOR * (this.x + Math.cos(this.rotationAngle) * 30),
      MINIMAP_SCALE_FACTOR * (this.y + Math.sin(this.rotationAngle) * 30)
    );
  }
}

class Ray {
  constructor(rayAngle) {
    this.rayAngle = normalizeAngle(rayAngle);
    this.wallHitX = 0;
    this.wallHitY = 0;
    this.distance = 0;
    this.wasHitVertical = false;

    this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
    this.isRayFacingUp = !this.isRayFacingDown;

    this.isRayFacingRight =
      this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI;
    this.isRayFacingLeft = !this.isRayFacingRight;
  }
  cast() {
    var xintercept, yintercept;
    var xstep, ystep;

    ////////////////////////////////////////////
    // Horizontal Ray-grid intersection code  //
    ////////////////////////////////////////////

    var foundHorzWallHit = false;
    var horzWallHitX = 0;
    var horzWallHitY = 0;

    // Find the y coordinate of the closest horizontal grid intersection
    yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
    // if ray is facingdown, we add 32 to the y coordinate because y values increase going down the screen
    yintercept += this.isRayFacingDown ? TILE_SIZE : 0;
    // Find the x coordinate of the closest horizontal grid intersection
    xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle);

    // calculate the increment xstep and ystep
    ystep = TILE_SIZE;
    ystep *= this.isRayFacingUp ? -1 : 1;

    xstep = TILE_SIZE / Math.tan(this.rayAngle);
    xstep *= this.isRayFacingLeft && xstep > 0 ? -1 : 1;
    xstep *= this.isRayFacingRight && xstep < 0 ? -1 : 1;

    var nextHorzTouchX = xintercept;
    var nextHorzTouchY = yintercept;

    // increment xstep and ystep until we find a wall
    while (
      nextHorzTouchX >= 0 &&
      nextHorzTouchX <= WINDOW_WIDTH &&
      nextHorzTouchY >= 0 &&
      nextHorzTouchY <= WINDOW_HEIGHT
    ) {
      if (
        grid.hasWallAt(
          nextHorzTouchX,
          nextHorzTouchY - (this.isRayFacingUp ? 1 : 0)
        )
      ) {
        // we found a wall
        foundHorzWallHit = true;
        horzWallHitX = nextHorzTouchX;
        horzWallHitY = nextHorzTouchY;

        break;
      } else {
        nextHorzTouchX += xstep;
        nextHorzTouchY += ystep;
      }
    }
    /////////////////////////////////////////
    // Vertical Ray-grid intersection code //
    /////////////////////////////////////////
    var foundVertWallHit = false;
    var vertWallHitX = 0;
    var vertWallHitY = 0;

    // Find the y coordinate of the closest vertical grid intersection
    xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
    // if ray is facingdown, we add 32 to the y coordinate because y values increase going down the screen
    xintercept += this.isRayFacingRight ? TILE_SIZE : 0;
    // Find the x coordinate of the closest vertical grid intersection
    yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle);

    // calculate the increment xstep and ystep
    xstep = TILE_SIZE;
    xstep *= this.isRayFacingLeft ? -1 : 1;

    ystep = TILE_SIZE * Math.tan(this.rayAngle);
    ystep *= this.isRayFacingUp && ystep > 0 ? -1 : 1;
    ystep *= this.isRayFacingDown && ystep < 0 ? -1 : 1;

    var nextVertTouchX = xintercept;
    var nextVertTouchY = yintercept;

    // increment xstep and ystep until we find a wall
    while (
      nextVertTouchX >= 0 &&
      nextVertTouchX <= WINDOW_WIDTH &&
      nextVertTouchY >= 0 &&
      nextVertTouchY <= WINDOW_HEIGHT
    ) {
      if (
        grid.hasWallAt(
          nextVertTouchX - (this.isRayFacingLeft ? 1 : 0),
          nextVertTouchY
        )
      ) {
        // we found a wall
        foundVertWallHit = true;
        vertWallHitX = nextVertTouchX;
        vertWallHitY = nextVertTouchY;

        break;
      } else {
        nextVertTouchX += xstep;
        nextVertTouchY += ystep;
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////
    // Calculate both horizontal and vertical distances and choose the smallest value //
    ////////////////////////////////////////////////////////////////////////////////////

    var horzHitDistance = foundHorzWallHit
      ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY)
      : Number.MAX_VALUE;

    var vertHitDistance = foundVertWallHit
      ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY)
      : Number.MAX_VALUE;

    // only store the smallest of the distances
    this.wallHitX =
      horzHitDistance < vertHitDistance ? horzWallHitX : vertWallHitX;
    this.wallHitY =
      horzHitDistance < vertHitDistance ? horzWallHitY : vertWallHitY;
    this.distance =
      horzHitDistance < vertHitDistance ? horzHitDistance : vertHitDistance;
    this.wasHitVertical = vertHitDistance < horzHitDistance;
  }

  render() {
    stroke("rgba(255,0,0,0.3)");
    line(
      MINIMAP_SCALE_FACTOR * player.x,
      MINIMAP_SCALE_FACTOR * player.y,
      MINIMAP_SCALE_FACTOR * this.wallHitX,
      MINIMAP_SCALE_FACTOR * this.wallHitY
    );
  }
}

var grid = new Map();
var player = new Player();
var rays = [];

function render3DProjectedWalls() {
  // loop every ray in the array of rays
  for (var i = 0; i < NUM_RAYS; i++) {
    var ray = rays[i];

    // remove fisheye effect by correcting raydistance to the correct distance from player
    var correctWallDistance =
      ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);

    //calculate the distance to the projection plane
    var distanceProjectionPlane = WINDOW_WIDTH / 2 / Math.tan(FOV_ANGLE / 2);

    // projected wall height
    var wallStripHeight =
      (TILE_SIZE / correctWallDistance) * distanceProjectionPlane;

    // change transparency based on wall distance
    var alpha = 1.0; //64 / correctWallDistance;

    var colour = ray.wasHitVertical ? 255 : 180;

    fill("rgba(" + colour + "," + colour + "," + colour + "," + alpha + ")");
    noStroke();
    rect(
      i * WALL_STRIP_WIDTH,
      WINDOW_HEIGHT / 2 - wallStripHeight / 2,
      WALL_STRIP_WIDTH,
      wallStripHeight
    );
  }
}

function normalizeAngle(angle) {
  angle = angle % (2 * Math.PI);
  if (angle < 0) {
    angle = 2 * Math.PI + angle;
  }
  return angle;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function keyPressed() {
  if (keyCode == UP_ARROW) {
    player.walkDirection = 1;
  } else if (keyCode == DOWN_ARROW) {
    player.walkDirection = -1;
  } else if (keyCode == RIGHT_ARROW) {
    player.turnDirection = 1;
  } else if (keyCode == LEFT_ARROW) {
    player.turnDirection = -1;
  }
}

function keyReleased() {
  if (keyCode == UP_ARROW) {
    player.walkDirection = 0;
  } else if (keyCode == DOWN_ARROW) {
    player.walkDirection = 0;
  } else if (keyCode == RIGHT_ARROW) {
    player.turnDirection = 0;
  } else if (keyCode == LEFT_ARROW) {
    player.turnDirection = 0;
  }
}

function castAllRays() {
  // start first ray subtracting half of the FOV
  var rayAngle = player.rotationAngle - FOV_ANGLE / 2;
  rays = [];

  //loop all columns casting the rays
  for (var i = 0; i < NUM_RAYS; i++) {
    var ray = new Ray(rayAngle);
    ray.cast();
    rays.push(ray);
    rayAngle += FOV_ANGLE / NUM_RAYS;
  }
}

function setup() {
  createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function update() {
  player.update();
  castAllRays();
}

function draw() {
  clear("#212121");
  update();

  render3DProjectedWalls();

  grid.render();

  for (ray of rays) {
    ray.render();
  }
  player.render();
}
