
uniform float time;
uniform vec2 resolution;

uniform vec3 cam_pos;
uniform vec3 cam_up;
uniform float fov;
uniform vec3 cam_vel;

uniform vec3 cam_dir = -1. * cam_pos;

const float PI = 3.141592653589793238462643383279;
const float DEG_TO_RAD = PI / 180.0;
mat3 ROTZ(float a) {
	return mat3(cos(a), -sin(a), 0, sin(a), cos(a), 0, 0, 0, 1);
}
mat3 ROTX(float a) {
	return mat3(1, 0, 0, 0, cos(a), -sin(a), 0, sin(a), cos(a));
}

const float MIN_TEMPERATURE = 1000.0;
const float TEMPERATURE_RANGE = 39000.0;

const float DISK_IN = 2.0;
const float DISK_WIDTH = 4.0;

uniform sampler2D star_texture;
uniform sampler2D disk_texture;

vec3 temp_to_color(float temp_kelvin){
	vec3 color;
	temp_kelvin = clamp(temp_kelvin, 1000.0, 40000.0) / 100.0;
	if (temp_kelvin <= 66.0){
	color.r = 255.0;
	color.g = log(temp_kelvin) * 99.4708025861 - 161.1195681661;
	} else {
	color.r = 329.698727446 * pow(max(temp_kelvin - 60.0, 0.0), -0.1332047592);
	color.r = clamp(color.r, 0.0, 255.0);
	color.g = 288.1221695283 * pow(max(temp_kelvin - 60.0, 0.0), -0.0755148492);
	}
	color.g = clamp(color.g, 0.0, 255.0);
	if (temp_kelvin >= 66.0){
	color.b = 255.0;
	} else if (temp_kelvin <= 19.0){
	color.b = 0.0;
	} else {
	color.b = 138.5177312231 * log(temp_kelvin - 10.0) - 305.0447927307;
	color.b = clamp(color.b, 0.0, 255.0);
	}
	color /= 255.0;
	return color;
}

vec3 lorentz_transform_velocity(vec3 ray_v, vec3 cam_v){
	float speed = length(cam_v);
	if (speed > 0.0){
		float dot_prod = dot(ray_v, cam_v);
		float gamma = 1.0 / sqrt(1.0 - dot_prod);
		vec3 new_ray_v = (ray_v / gamma - cam_v + (gamma / (gamma + 1.0)) * dot_prod * cam_v) / (1.0 - dot_prod);
		return new_ray_v;
	}
	return ray_v;
}

vec2 screen_to_gl(vec2 screen_size){
	return 2.0 * (gl_FragCoord.xy / screen_size.xy) - 1.0;
}

vec2 cat_to_spherical(vec3 cartesian_coord){
	return vec2(atan(cartesian_coord.z,cartesian_coord.x), asin(cartesian_coord.y)) * vec2(1.0/(2.0*PI), 1.0/PI) + 0.5;
}

void main()	{
	float uvfov = tan(fov / 2.0 * DEG_TO_RAD);
	vec2 uv = screen_to_gl(resolution) * vec2(resolution.x/resolution.y, 1.0);
	vec3 forward = normalize(cam_dir);
	forward = ROTX(10.*PI / 180.) * forward;
	forward = normalize(forward);
	vec3 up = normalize(cam_up);
	vec3 nright = normalize(cross(forward, up));
	//up = cross(nright, forward);



	vec3 pixel_pos = cam_pos + forward + nright * uv.x * uvfov + up * uv.y * uvfov;
	vec3 ray_dir = lorentz_transform_velocity(normalize(pixel_pos - cam_pos), cam_vel); //lorentz transformation
	vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

	vec3 pos = cam_pos;
	vec3 vel = ray_dir;
	vec3 angular_vel = cross(pos, vel);
	float angular_speed2 = dot(angular_vel, angular_vel);

	float ray_doppler_factor = (1.0 + dot(ray_dir, -cam_vel)) / sqrt(1.0 - dot(cam_vel, cam_vel)); //doppler effect
	float ray_intensity = 1.0 / ray_doppler_factor / ray_doppler_factor / ray_doppler_factor; //beaming

	vec3 old_pos = cam_pos - ray_dir * STEP;
	float distance = length(pos);

	for (int i = 0; i < NSTEPS; i++){
		vec3 temp = pos;
		float pos_dot = dot(pos, pos);
		vec3 accel = -1.5 * angular_speed2 * pos / pos_dot / pos_dot / sqrt(pos_dot);
		vec3 vel = (pos - old_pos) / STEP;
		pos += vel * STEP + accel * STEP * STEP;

	    if (distance < 1.0 && length(old_pos) > 1.0) { // intersect event horizon
	      vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
	      color += black;
	      break;
	    }

		if (old_pos.y * pos.y < 0.0) { // accretion disk is in the XZ plane
			float lambda = -old_pos.y / vel.y;
			vec3 intersection = old_pos + lambda * vel;
			float r = length(intersection);
			if (DISK_IN <= r && r <= DISK_IN+DISK_WIDTH ){
				float phi = atan(intersection.x, intersection.z);
				vec3 disk_velocity = vec3(-intersection.x, 0.0, intersection.z) / sqrt(2.0 * (r - 1.0)) / (r * r);
				phi += time;
				phi = mod(phi , 2.0 * PI);
				float disk_gamma = 1.0 / sqrt(1.0 - dot(disk_velocity, disk_velocity));
				float disk_doppler_factor = disk_gamma * (1.0 + dot(ray_dir / distance, disk_velocity));

				vec2 tex_coord = vec2(mod(phi, 2.0 * PI) / (2.0 * PI), 1.0 - (r - DISK_IN) / DISK_WIDTH);
				vec4 disk_color = texture2D(disk_texture, tex_coord) / ray_doppler_factor / disk_doppler_factor;
				float disk_alpha = clamp(dot(disk_color, disk_color) / 4.5, 0.0, 1.0);
				disk_alpha /= disk_doppler_factor * disk_doppler_factor * disk_doppler_factor;
				color += vec4(disk_color)*disk_alpha;
			}
		}
		old_pos = temp;
		distance = length(pos);
	}

	if (distance > 1.0) {
	    ray_dir = normalize(pos);
	    vec2 tex_coord = cat_to_spherical(ray_dir * ROTZ(45.0 * DEG_TO_RAD));
    	vec4 star_color = texture2D(star_texture, tex_coord);
	    if (star_color.g > 0.0){
			float star_temperature = MIN_TEMPERATURE + TEMPERATURE_RANGE * star_color.r;
			float star_velocity = star_color.b - 0.5;
			float star_doppler_factor = sqrt((1.0 + star_velocity) / (1.0 - star_velocity));
	    	star_temperature /= ray_doppler_factor*star_doppler_factor;
	    	color += vec4(temp_to_color(star_temperature), 1.0)* star_color.g;
	    }
  	}
  gl_FragColor = color*ray_intensity;
}
