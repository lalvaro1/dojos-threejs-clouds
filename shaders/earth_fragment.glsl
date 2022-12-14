export const earth_fragmentShader = `

out vec4 fragColor;
varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform float time;
uniform sampler2D ground;
uniform sampler2D mask;
uniform sampler2D normalMap;
uniform sampler2D clouds;

vec3 computeLocalNormal() {
   vec3 normalData = (texture(normalMap, v_UV).rgb - 0.5) * 2.;
   vec3 materialNormal = normalize(vec3(normalData.xy, 0.2));

    vec3 N = v_normal;
    vec3 T = normalize(vec3(N.z, 0., -N.x));
    vec3 B = cross(N, T);

    mat3 TBN = mat3(T, B, N);

    return TBN * materialNormal;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3 localNormal = computeLocalNormal();

    vec3 light = normalize(vec3(1, -0.2, -0.5));
    float ambient = 0.1;
    float diffuse = dot(-light, localNormal);

    vec3 refl = reflect(light, localNormal);

    float mask = texture(mask, v_UV).r;
    float specular = pow(max(dot(refl, normalize(cameraPosition-v_position)), 0.), 3.) * 0.15 * mask;

    fragColor.xyz = (texture(ground, v_UV).rgb * (ambient + diffuse) + specular);
    fragColor.a = 1.0;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;