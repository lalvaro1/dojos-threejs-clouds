const clouds_fragmentShader = `

out vec4 fragColor;
varying vec3 v_normal;
varying vec2 v_UV;
varying vec3 v_position;

uniform sampler2D clouds;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec3  light = normalize(vec3(1, -0.2, -0.5));
    float ambient = 0.05;
    float diffuse = max(0., dot(-light, v_normal));
    diffuse = smoothstep(0., 0.33, diffuse);

    vec3 refl = reflect(light, v_normal);
    float specular = pow(max(dot(refl, normalize(cameraPosition-v_position)), 0.), 3.) * 0.15;

    vec3 view = normalize(v_position - cameraPosition);
    float normalCheating = smoothstep(0.15, 0.25, abs(dot(view, -v_normal)));

    float cloudTexture = texture(clouds, v_UV).r;
    float northPoleCheating = smoothstep(0.925, 1., v_UV.y);
    float northPoleColor = 0.66;
   // cloudTexture = mix(cloudTexture, northPoleColor, northPoleCheating);

    float clouds = (cloudTexture * (ambient + diffuse) + specular) * normalCheating;

    fragColor = vec4(vec3(cloudTexture), clouds);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
`;