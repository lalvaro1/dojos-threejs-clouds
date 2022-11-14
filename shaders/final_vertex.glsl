const final_vertexShader = `

varying vec2 v_UV;

void main() {

    v_UV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}

`