#version 300 es

in vec3 a_position; // uguale a inPosition
in vec2 a_uv;
in vec3 inNormal;

out vec2 uvFS;
out vec3 fsNormal;
out vec3 fsPosition;

uniform mat4 matrix;
uniform mat4 nMatrix;

void main() {
  uvFS = a_uv;

  fsNormal = mat3(nMatrix) * inNormal;
  fsPosition = (matrix * vec4(a_position, 1.0)).xyz;
  gl_Position = matrix * vec4(a_position,1.0);
}