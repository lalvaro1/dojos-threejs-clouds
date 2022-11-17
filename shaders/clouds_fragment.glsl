export const clouds_fragmentShader = `

out vec4 fragColor;
varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform sampler2D clouds;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    float clouds = texture(clouds, v_UV);
    fragColor = vec4(1,1,1,clouds);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;