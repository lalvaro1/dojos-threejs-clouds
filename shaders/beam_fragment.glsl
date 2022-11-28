export const beam_fragmentShader = `

out vec4 fragColor;

varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform float time;

uniform float segments;
uniform float speed;
uniform float stretching;
uniform float minAlpha;
uniform float rayIntensity;
uniform float baseIntensity;
uniform vec3 rayColor;
uniform vec3 baseColor;
uniform int waveForm;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3 light = normalize(vec3(1, -0.2, -0.5));
    float diffuse = max(0., dot(-light, v_normal));

    float height = length(v_position);
    float earthJunction = 1. - smoothstep(0.50, 0.505, height);

    vec3 view = normalize(v_position - cameraPosition);
    float closeToCenter = dot(view, -v_normal);
    float alphaEdgeSmoothing = pow(closeToCenter, 2.);

    vec3 beamColor = mix(rayColor, baseColor, earthJunction);

    float alphaVerticalCut = smoothstep(0.495, 0.500, height);

    float waveAlpha;
    
    switch(waveForm) {
        case 0 : {
            waveAlpha = minAlpha + (sin(time * speed + pow(height, stretching) * segments) + 1.)* 0.5 * (1. - minAlpha);
            break;
        }
        case 1 : {
            float z = time * speed * 0.05 + pow(height, stretching) * segments * 0.25;
            float discrete = floor( (z+0.1) / 0.2 ) * 0.2;    

            waveAlpha = 1. - smoothstep(0.0, 0.02, abs(z - discrete));
            break;
        }
        case 2 : {
            float c = mod(time * speed * 0.05 + pow(height, stretching) * segments * 0.25, 0.2);
            waveAlpha = 1. - smoothstep(0.05, 0.2, c);
            break;
        }

    
    }

    fragColor.rgb = beamColor;
    fragColor.a = max(waveAlpha * rayIntensity, earthJunction * baseIntensity) * alphaVerticalCut * alphaEdgeSmoothing;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;