export const night_fragmentShader = `

out vec4 fragColor;
varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform sampler2D night;
uniform vec3 color;
uniform sampler2D clouds;
uniform float cloudAttenuation;

float cloudPos = 0.f; //tmp

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3 light = normalize(vec3(1, -0.2, -0.5));
    vec3 nightTexture = texture(night, v_UV).rgb;    

    float diffuse = max(0., dot(-light, v_normal));
    float nightDayRatio = smoothstep(0.5, 1.0, 1. - diffuse);

    float cloudShadowing = 1. - texture(clouds, v_UV + vec2(cloudPos, 0.) ).r * cloudAttenuation;

    vec3 nightColor = vec3(255., 230., 63.)/255.;

    fragColor.rgb = nightTexture.r * nightDayRatio * color * cloudShadowing;
    fragColor.a = 1.0;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;