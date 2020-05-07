class Camera extends THREE.PerspectiveCamera {
  constructor(fov, aspect_ratio, near, far) {
    super(fov, aspect_ratio, near, far);
    this.time = 0;
    this.angle = 0;
    this.omega = 0;
    //Verlet Integration
    this.maxOmega = 0;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.position.set(0, 0, 1);
    this.direction = new THREE.Vector3(0,0,1);
    //Needs to show black hole, camera angle can't be 0
    this.deflection = -5 * Math.PI / 180;
    this.moving = true;
  }
  set radius(r) {
    this.r = r;
    this.maxOmega = 1 / this.r / this.r;
    this.position.set(this.position.normalize() * this.r);
  }
  get radius() {
    return this.r;
  }


  update(dt) {
    this.dt = dt;

    this.angle += dt * this.omega;
    this.position.set(this.r * Math.sin(this.angle), 0, this.r * Math.cos(this.angle));
    this.velocity.set(this.omega * Math.cos(this.angle), 0 ,this.omega * -1 * Math.sin(this.angle));

    let deflectionMatrix = (new THREE.Matrix4()).makeRotationX(this.deflection);

    this.position.applyMatrix4(deflectionMatrix);
    this.velocity.applyMatrix4(deflectionMatrix);

    this.omega = this.maxOmega;

    this.time += this.dt;

  }
}
