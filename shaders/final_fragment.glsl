const final_fragmentShader = `

out vec4 fragColor;
varying vec2 v_UV;
uniform sampler2D tDiffuse;
uniform sampler2D glowLayer;
uniform sampler2D cloudLayer;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    float cloud = texture2D(cloudLayer, v_UV ).r;
    vec4 ground = texture2D(tDiffuse, v_UV ) + texture2D(glowLayer, v_UV);

    fragColor = mix(ground, vec4(1), cloud);
    fragColor.a = 1.;

    //fragColor = vec4(vec3(texture2D(cloudLayer, v_UV ).r), 1.);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}

`;

