const night_fragmentShader = `

out vec4 fragColor;
varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform float time;
uniform sampler2D ground;
uniform sampler2D mask;
uniform sampler2D normalMap;
uniform sampler2D clouds;
uniform sampler2D night;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3 nightTexture = texture(night, v_UV).rgb;    

//    float night_display = smoothstep(0.5, 1.0, 1. - diffuse);
//    vec3 groundTexture = dayTexture + nightTexture * night_display;

    fragColor.xyz = nightTexture.rgb;
    fragColor.a = 1.0;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;