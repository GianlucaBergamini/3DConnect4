#version 300 es

in vec3 a_position; // vertex positions
in vec2 a_uv;
in vec3 inNormal; // vertex normals

out vec2 uvFS;
out vec3 fsNormal;
out vec3 fsPosition;

uniform mat4 matrix; // projection matrix
uniform mat4 nMatrix; // invert transpose of the view world matrix
uniform mat4 pMatrix; // world matrix

void main() {
  uvFS = a_uv;

  fsNormal = mat3(nMatrix) * inNormal;
  fsPosition = (pMatrix * vec4(a_position, 1.0)).xyz;
  gl_Position = matrix * vec4(a_position,1.0);
}