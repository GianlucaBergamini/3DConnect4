#version 300 es

precision mediump float;

in vec2 uvFS;
in vec3 fsNormal;
in vec3 fsPosition;

out vec4 outColor;

uniform sampler2D u_texture;
uniform vec3 dirLightDirection; // directional light direction vec
uniform vec3 dirLightColor; //directional light color
uniform vec3 ambientLightCoeff;
uniform vec3 ambientColor;
uniform vec3 spotLight1Pos;
uniform vec3 spotLight1Color;
uniform vec3 spotLight1Dir;
uniform vec3 spotLight2Pos;
uniform vec3 spotLight2Color;
uniform vec3 spotLight2Dir;

uniform vec3 mSpecColor; //material specular color
uniform float mSpecPower;

uniform float spotLightTarget;
uniform float spotLightDecay;
uniform float outerCone;
uniform float innerCone;


vec3 f_diff(vec3 lx, vec3 n) {

  vec3 txt_col = texture(u_texture, uvFS).xyz;
  return txt_col * clamp(dot(normalize(lx), n), 0.0, 1.0);
}

vec3 f_spec(vec3 lx, vec3 eye_dir, vec3 n) {

  lx = normalize(lx);
  vec3 r = 2.0 * dot(lx, n) * n - lx;
  return mSpecColor * pow(clamp(dot(eye_dir, r), 0.0, 1.0), mSpecPower);
}

vec3 f_BRDF(vec3 lx, vec3 eye_dir, vec3 n) {

  return clamp(f_diff(lx, n) + f_spec(lx, eye_dir, n), 0.0, 1.0);
}

vec3 spot_light(vec3 l_spot, vec3 lx, vec3 spot_dir) {

  return l_spot * pow(spotLightTarget / length(lx), spotLightDecay) * clamp((dot(normalize(lx), spot_dir) - cos(radians(outerCone/2.0))) / (cos(radians(innerCone/2.0)) - cos(radians(outerCone/2.0))), 0.0, 1.0);
}

void main() {
  vec3 nEyeDirection = normalize(-fsPosition);
  vec3 nNormal = normalize(fsNormal);
  vec3 ndirLightDirection = - normalize(dirLightDirection);
  vec3 nSpotLight1Dir = - normalize(spotLight1Dir);
  vec3 nSpotLight2Dir = - normalize(spotLight2Dir);
  vec3 lx1 = spotLight1Pos - fsPosition;
  vec3 lx2 = spotLight2Pos - fsPosition;

  vec3 dirLight = dirLightColor * f_BRDF(dirLightDirection, nEyeDirection, nNormal);

  vec3 spotLight1 = spot_light(spotLight1Color, lx1, nSpotLight1Dir) * f_BRDF(lx1, nEyeDirection, nNormal);
  vec3 spotLight2 = spot_light(spotLight2Color, lx2, nSpotLight2Dir) * f_BRDF(lx2, nEyeDirection, nNormal);

  vec3 ambientLight = texture(u_texture, uvFS).xyz * ambientLightCoeff * ambientColor;

  outColor = vec4(clamp(dirLight + ambientLight + spotLight1 + spotLight2, 0.0, 1.0), texture(u_texture, uvFS).a);
}