const clouds_fragmentShader = `

out vec4 fragColor;
varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform sampler2D clouds;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3  light = normalize(vec3(1, -0.2, -0.5));
    float ambient = 0.;
    float diffuse = max(0., dot(-light, v_normal));

    vec3 refl = reflect(light, v_normal);
    float specular = pow(max(dot(refl, normalize(cameraPosition-v_position)), 0.), 3.) * 0.15;

    vec3 view = normalize(v_position - cameraPosition);
    float normalCheating = smoothstep(0.15, 0.25, abs(dot(view, -v_normal)));

    float clouds = (texture(clouds, v_UV).r * (ambient + diffuse) + specular) * normalCheating;
    fragColor = vec4(1,1,1,clouds);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;