#version 300 es

precision mediump float;

in vec2 uvFS;
in vec3 fsNormal;

out vec4 outColor;

uniform sampler2D u_texture;
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color

void main() {
  vec3 lightDirNorm = normalize(lightDirection);
  vec3 nNormal = normalize(fsNormal);
  vec3 lambertColor = texture(u_texture, uvFS).rgb * lightColor * dot(-lightDirNorm, nNormal);
  outColor = vec4(clamp(lambertColor, 0.0, 1.0),1.0);
}