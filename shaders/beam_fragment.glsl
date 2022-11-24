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

    float alphaAnimation = minAlpha + (sin(time * speed + pow(height, stretching) * segments) + 1.)* 0.5 * (1. - minAlpha);

    fragColor.rgb = beamColor;
    fragColor.a = max(alphaAnimation * rayIntensity, earthJunction * baseIntensity) * alphaVerticalCut * alphaEdgeSmoothing;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;