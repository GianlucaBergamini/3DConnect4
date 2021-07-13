#version 300 es

precision mediump float;

in vec2 uvFS;
in vec3 fsNormal;
in vec3 fsPosition;

out vec4 outColor;

uniform sampler2D u_texture;
uniform vec3 dirLight1Direction; // directional light direction vec
uniform vec3 dirLight1Color; //directional light color
uniform vec3 dirLight2Direction; // directional light direction vec
uniform vec3 dirLight2Color; //directional light color
uniform vec3 ambientLightCoeff;
uniform vec3 ambientColor;

uniform vec3 mSpecColor; //material specular color
uniform float mSpecPower;

vec3 lambDiffuse(vec3 lx, vec3 n) {
  vec3 textureColor = texture(u_texture, uvFS).xyz;
  return textureColor * clamp(dot(normalize(lx), n), 0.0, 1.0);
}

vec3 phongSpecular(vec3 lx, vec3 eyeDir, vec3 n) {
  lx = normalize(lx);
  vec3 r = 2.0 * dot(lx, n) * n - lx;
  return mSpecColor * pow(clamp(dot(eyeDir, r), 0.0, 1.0), mSpecPower);
}

vec3 fBRDF(vec3 lx, vec3 eyeDir, vec3 n) {
  return clamp(lambDiffuse(lx, n) + phongSpecular(lx, eyeDir, n), 0.0, 1.0);
}

void main() {
  vec3 nEyeDirection = normalize(-fsPosition);
  vec3 nNormal = normalize(fsNormal);
  vec3 ndirLight1Direction = - normalize(dirLight1Direction);
  vec3 ndirLight2Direction = - normalize(dirLight2Direction);

  vec3 dirLight1 = dirLight1Color * fBRDF(dirLight1Direction, nEyeDirection, nNormal);
  vec3 dirLight2 = dirLight2Color * fBRDF(dirLight2Direction, nEyeDirection, nNormal);

  vec3 ambientLight = texture(u_texture, uvFS).xyz * ambientLightCoeff * ambientColor;

  outColor = vec4(clamp(dirLight1 + dirLight2 + ambientLight, 0.0, 1.0), texture(u_texture, uvFS).a);
}